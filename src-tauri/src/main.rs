#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod filesystem;
mod settings;
mod trash;
mod watcher;

use tauri::Emitter;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(watcher::WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            filesystem::select_folder,
            filesystem::load_library,
            filesystem::read_file,
            filesystem::write_prompt_file,
            filesystem::rename_file,
            filesystem::create_library,
            filesystem::seed_samples,
            filesystem::get_file_mtime,
            trash::trash_file,
            trash::reveal_file,
            watcher::start_watcher,
            settings::load_settings,
            settings::save_settings
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Let the frontend decide: unsaved editor changes must be confirmed first.
                api.prevent_close();
                let _ = window.emit("app-close-requested", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running MT-Deck");
}
