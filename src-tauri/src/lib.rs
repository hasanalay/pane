mod pty;
mod workspace_fs;

use pty::PtyState;
use workspace_fs::WorkspaceFsState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WorkspaceFsState::default())
        .manage(PtyState::default())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            workspace_fs::set_workspace_root,
            workspace_fs::list_workspace_directory,
            workspace_fs::read_workspace_text_file,
            workspace_fs::write_workspace_text_file,
            pty::start_pty,
            pty::write_pty,
            pty::resize_pty,
            pty::kill_pty
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pane");
}
