mod workspace_fs;

use workspace_fs::WorkspaceFsState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(WorkspaceFsState::default())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            workspace_fs::set_workspace_root,
            workspace_fs::list_workspace_directory,
            workspace_fs::read_workspace_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pane");
}
