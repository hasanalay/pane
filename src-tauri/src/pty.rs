use crate::workspace_fs::{active_workspace_root, WorkspaceFsState};
use portable_pty::{
    native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtySize, PtySystem,
};
use serde::Serialize;
use std::{
    collections::HashMap,
    io::{Read, Write},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
    thread,
};
use tauri::{ipc::Channel, State};

#[derive(Default)]
pub struct PtyState {
    inner: Arc<PtyStateInner>,
}

#[derive(Default)]
struct PtyStateInner {
    sessions: Mutex<HashMap<String, PtySession>>,
    next_id: AtomicU64,
}

struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    killer: Box<dyn ChildKiller + Send + Sync>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PtySessionInfo {
    terminal_id: String,
    pid: Option<u32>,
    shell: String,
    cwd: String,
}

#[derive(Clone, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "event",
    content = "data"
)]
pub enum PtyEvent {
    Output {
        terminal_id: String,
        data: String,
    },
    Exit {
        terminal_id: String,
        exit_code: Option<u32>,
    },
    Error {
        terminal_id: String,
        message: String,
    },
}

impl PtyState {
    fn next_terminal_id(&self) -> String {
        let id = self.inner.next_id.fetch_add(1, Ordering::Relaxed) + 1;
        format!("terminal-{id}")
    }
}

fn normalized_size(cols: u16, rows: u16) -> PtySize {
    PtySize {
        rows: rows.max(1),
        cols: cols.max(2),
        pixel_width: 0,
        pixel_height: 0,
    }
}

fn user_shell() -> String {
    std::env::var("SHELL")
        .ok()
        .filter(|shell| !shell.trim().is_empty())
        .unwrap_or_else(|| "/bin/zsh".to_string())
}

#[tauri::command]
pub fn start_pty(
    cols: u16,
    rows: u16,
    on_event: Channel<PtyEvent>,
    workspace_state: State<'_, WorkspaceFsState>,
    pty_state: State<'_, PtyState>,
) -> Result<PtySessionInfo, String> {
    let root = active_workspace_root(&workspace_state)?;
    let shell = user_shell();
    let terminal_id = pty_state.next_terminal_id();

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(normalized_size(cols, rows))
        .map_err(|error| format!("failed to create PTY: {error}"))?;

    let mut command = CommandBuilder::new(&shell);
    command.cwd(root.as_os_str());
    command.env("TERM", "xterm-256color");
    command.env("COLORTERM", "truecolor");
    command.env("TERM_PROGRAM", "Pane");

    let mut child = pair
        .slave
        .spawn_command(command)
        .map_err(|error| format!("failed to start shell: {error}"))?;
    drop(pair.slave);

    let pid = child.process_id();
    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|error| format!("failed to clone PTY reader: {error}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|error| format!("failed to take PTY writer: {error}"))?;
    let killer = child.clone_killer();

    pty_state
        .inner
        .sessions
        .lock()
        .map_err(|_| "PTY state lock is poisoned".to_string())?
        .insert(
            terminal_id.clone(),
            PtySession {
                master: pair.master,
                writer,
                killer,
            },
        );

    let reader_terminal_id = terminal_id.clone();
    let reader_events = on_event.clone();
    thread::spawn(move || {
        let mut buffer = [0_u8; 8192];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(read) => {
                    let data = String::from_utf8_lossy(&buffer[..read]).into_owned();
                    if reader_events
                        .send(PtyEvent::Output {
                            terminal_id: reader_terminal_id.clone(),
                            data,
                        })
                        .is_err()
                    {
                        break;
                    }
                }
                Err(error) => {
                    let _ = reader_events.send(PtyEvent::Error {
                        terminal_id: reader_terminal_id.clone(),
                        message: format!("PTY read failed: {error}"),
                    });
                    break;
                }
            }
        }
    });

    let wait_terminal_id = terminal_id.clone();
    let wait_events = on_event;
    let inner = Arc::clone(&pty_state.inner);
    thread::spawn(move || {
        let exit_code = match child.wait() {
            Ok(status) => Some(status.exit_code()),
            Err(error) => {
                let _ = wait_events.send(PtyEvent::Error {
                    terminal_id: wait_terminal_id.clone(),
                    message: format!("failed waiting for shell exit: {error}"),
                });
                None
            }
        };

        let _ = wait_events.send(PtyEvent::Exit {
            terminal_id: wait_terminal_id.clone(),
            exit_code,
        });

        if let Ok(mut sessions) = inner.sessions.lock() {
            sessions.remove(&wait_terminal_id);
        }
    });

    Ok(PtySessionInfo {
        terminal_id,
        pid,
        shell,
        cwd: root.to_string_lossy().into_owned(),
    })
}

#[tauri::command]
pub fn write_pty(
    terminal_id: String,
    data: String,
    pty_state: State<'_, PtyState>,
) -> Result<(), String> {
    let mut sessions = pty_state
        .inner
        .sessions
        .lock()
        .map_err(|_| "PTY state lock is poisoned".to_string())?;
    let session = sessions
        .get_mut(&terminal_id)
        .ok_or_else(|| "terminal session is not running".to_string())?;

    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|error| format!("failed to write to PTY: {error}"))?;
    session
        .writer
        .flush()
        .map_err(|error| format!("failed to flush PTY input: {error}"))
}

#[tauri::command]
pub fn resize_pty(
    terminal_id: String,
    cols: u16,
    rows: u16,
    pty_state: State<'_, PtyState>,
) -> Result<(), String> {
    let sessions = pty_state
        .inner
        .sessions
        .lock()
        .map_err(|_| "PTY state lock is poisoned".to_string())?;
    let session = sessions
        .get(&terminal_id)
        .ok_or_else(|| "terminal session is not running".to_string())?;

    session
        .master
        .resize(normalized_size(cols, rows))
        .map_err(|error| format!("failed to resize PTY: {error}"))
}

#[tauri::command]
pub fn kill_pty(
    terminal_id: String,
    pty_state: State<'_, PtyState>,
) -> Result<(), String> {
    let mut session = {
        let mut sessions = pty_state
            .inner
            .sessions
            .lock()
            .map_err(|_| "PTY state lock is poisoned".to_string())?;
        sessions.remove(&terminal_id)
    };

    if let Some(ref mut session) = session {
        session
            .killer
            .kill()
            .map_err(|error| format!("failed to stop terminal session: {error}"))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{normalized_size, PtyState};

    #[test]
    fn clamps_invalid_terminal_dimensions() {
        let size = normalized_size(0, 0);
        assert_eq!(size.cols, 2);
        assert_eq!(size.rows, 1);
    }

    #[test]
    fn terminal_ids_are_monotonic() {
        let state = PtyState::default();
        assert_eq!(state.next_terminal_id(), "terminal-1");
        assert_eq!(state.next_terminal_id(), "terminal-2");
    }
}
