mod workspace_fs;

use workspace_fs::{
    list_workspace_directory, read_workspace_text_file, set_workspace_root, WorkspaceFsState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WorkspaceFsState::default())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            set_workspace_root,
            list_workspace_directory,
            read_workspace_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pane");
}
