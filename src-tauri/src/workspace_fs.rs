use serde::Serialize;
use std::{
    fs,
    path::{Component, Path, PathBuf},
    sync::Mutex,
};
use tauri::State;

const MAX_TEXT_FILE_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Default)]
pub struct WorkspaceFsState {
    root: Mutex<Option<PathBuf>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceEntry {
    name: String,
    relative_path: String,
    kind: WorkspaceEntryKind,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
enum WorkspaceEntryKind {
    File,
    Directory,
}

fn safe_relative_path(relative_path: &str) -> Result<&Path, String> {
    let path = Path::new(relative_path);

    if path.is_absolute() {
        return Err("workspace path must be relative".into());
    }

    for component in path.components() {
        match component {
            Component::Normal(_) | Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err("workspace path cannot escape the active root".into());
            }
        }
    }

    Ok(path)
}

pub(crate) fn active_workspace_root(state: &WorkspaceFsState) -> Result<PathBuf, String> {
    state
        .root
        .lock()
        .map_err(|_| "workspace state lock is poisoned".to_string())?
        .clone()
        .ok_or_else(|| "no active workspace".to_string())
}

fn active_root(state: &State<'_, WorkspaceFsState>) -> Result<PathBuf, String> {
    active_workspace_root(state)
}

fn resolve_existing(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let relative = safe_relative_path(relative_path)?;
    let candidate = if relative.as_os_str().is_empty() {
        root.to_path_buf()
    } else {
        root.join(relative)
    };

    let canonical = fs::canonicalize(&candidate)
        .map_err(|error| format!("failed to resolve workspace path: {error}"))?;

    if !canonical.starts_with(root) {
        return Err("workspace path resolves outside the active root".into());
    }

    Ok(canonical)
}

#[tauri::command]
pub fn set_workspace_root(
    root_path: String,
    state: State<'_, WorkspaceFsState>,
) -> Result<(), String> {
    let canonical = fs::canonicalize(&root_path)
        .map_err(|error| format!("failed to open workspace: {error}"))?;

    if !canonical.is_dir() {
        return Err("workspace root must be a directory".into());
    }

    *state
        .root
        .lock()
        .map_err(|_| "workspace state lock is poisoned".to_string())? = Some(canonical);

    Ok(())
}

#[tauri::command]
pub fn list_workspace_directory(
    relative_path: String,
    state: State<'_, WorkspaceFsState>,
) -> Result<Vec<WorkspaceEntry>, String> {
    let root = active_root(&state)?;
    let directory = resolve_existing(&root, &relative_path)?;

    if !directory.is_dir() {
        return Err("requested workspace path is not a directory".into());
    }

    let mut entries = Vec::new();
    let read_dir = fs::read_dir(&directory)
        .map_err(|error| format!("failed to read workspace directory: {error}"))?;

    for entry in read_dir {
        let entry = entry.map_err(|error| format!("failed to read directory entry: {error}"))?;
        let file_type = entry
            .file_type()
            .map_err(|error| format!("failed to inspect directory entry: {error}"))?;

        if file_type.is_symlink() {
            continue;
        }

        let kind = if file_type.is_dir() {
            WorkspaceEntryKind::Directory
        } else if file_type.is_file() {
            WorkspaceEntryKind::File
        } else {
            continue;
        };

        let path = entry.path();
        let relative = path
            .strip_prefix(&root)
            .map_err(|_| "workspace entry escaped active root".to_string())?;

        entries.push(WorkspaceEntry {
            name: entry.file_name().to_string_lossy().into_owned(),
            relative_path: relative.to_string_lossy().into_owned(),
            kind,
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn read_workspace_text_file(
    relative_path: String,
    state: State<'_, WorkspaceFsState>,
) -> Result<String, String> {
    let root = active_root(&state)?;
    let path = resolve_existing(&root, &relative_path)?;
    let metadata = fs::metadata(&path)
        .map_err(|error| format!("failed to inspect workspace file: {error}"))?;

    if !metadata.is_file() {
        return Err("requested workspace path is not a file".into());
    }

    if metadata.len() > MAX_TEXT_FILE_BYTES {
        return Err(format!(
            "file is too large to open in M0 (limit: {} MiB)",
            MAX_TEXT_FILE_BYTES / 1024 / 1024
        ));
    }

    let bytes = fs::read(&path).map_err(|error| format!("failed to read workspace file: {error}"))?;
    String::from_utf8(bytes).map_err(|_| "file is not valid UTF-8 text".to_string())
}

#[tauri::command]
pub fn write_workspace_text_file(
    relative_path: String,
    content: String,
    state: State<'_, WorkspaceFsState>,
) -> Result<(), String> {
    if content.len() as u64 > MAX_TEXT_FILE_BYTES {
        return Err(format!(
            "file is too large to save in M0 (limit: {} MiB)",
            MAX_TEXT_FILE_BYTES / 1024 / 1024
        ));
    }

    let root = active_root(&state)?;
    let path = resolve_existing(&root, &relative_path)?;
    let metadata = fs::metadata(&path)
        .map_err(|error| format!("failed to inspect workspace file: {error}"))?;

    if !metadata.is_file() {
        return Err("requested workspace path is not a file".into());
    }

    fs::write(&path, content.as_bytes())
        .map_err(|error| format!("failed to save workspace file: {error}"))
}

#[cfg(test)]
mod tests {
    use super::safe_relative_path;

    #[test]
    fn accepts_nested_workspace_relative_paths() {
        assert!(safe_relative_path("src/components/App.tsx").is_ok());
        assert!(safe_relative_path("").is_ok());
    }

    #[test]
    fn rejects_parent_directory_traversal() {
        assert!(safe_relative_path("../outside.txt").is_err());
        assert!(safe_relative_path("src/../../outside.txt").is_err());
    }

    #[test]
    fn rejects_absolute_paths() {
        assert!(safe_relative_path("/tmp/outside.txt").is_err());
    }
}
