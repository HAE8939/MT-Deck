#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod filesystem;
mod settings;
mod trash;
mod watcher;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("仅允许打开 HTTP(S) 地址".into());
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Brings the main window back to the foreground. Shared by the tray menu,
/// tray double-click and the single-instance callback so every "唤回" path
/// behaves identically (ISSUE-006).
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn main() {
    tauri::Builder::default()
        // Must be the first plugin registered: a second launch must bail out
        // before any window or tray is created.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(watcher::WatcherState::default())
        .setup(|app| {
            let show = MenuItemBuilder::with_id("show", "显示 MT-Deck").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&show, &quit]).build()?;
            let tray_icon = app
                .default_window_icon()
                .cloned()
                .expect("bundled window icon is missing");
            TrayIconBuilder::with_id("main-tray")
                .icon(tray_icon)
                .menu(&menu)
                .tooltip("MT-Deck")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::DoubleClick { .. } = event {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_external_url,
            filesystem::select_folder,
            filesystem::load_library,
            filesystem::read_file,
            filesystem::write_prompt_file,
            filesystem::rename_file,
            filesystem::pick_image,
            filesystem::save_image_path,
            filesystem::write_image_base64,
            filesystem::read_image_base64,
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
