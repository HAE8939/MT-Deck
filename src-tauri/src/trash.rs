use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(not(target_os = "windows"))]
use std::path::Path;

/// Moves a file to the system Recycle Bin. Never a permanent delete.
#[tauri::command]
pub fn trash_file(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| format!("Unable to move file to the Recycle Bin: {e}"))
}

/// Reveals the file in Windows File Explorer and selects it.
#[tauri::command]
pub fn reveal_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Explorer's `/select` switch is picky: it mis-parses forward slashes
        // (libraryRoot may be stored as `E:/...` and WalkDir then produces
        // mixed-separator paths) and it rejects a command line where the whole
        // `/select,...` token is quoted (what Command::arg does once the path
        // contains a space). Normalize to backslashes and quote only the path,
        // which is the one form Explorer reliably accepts: /select,"<path>".
        let normalized = path.replace('/', "\\");
        Command::new("explorer")
            .raw_arg(format!("/select,\"{normalized}\""))
            .spawn()
            .map_err(|e| format!("Unable to open File Explorer: {e}"))?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        if let Some(parent) = Path::new(&path).parent() {
            let cmd = if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
            Command::new(cmd)
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Unable to open folder: {e}"))?;
        }
        Ok(())
    }
}
