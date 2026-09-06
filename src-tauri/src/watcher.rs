use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::path::Path;
use std::sync::mpsc;
use std::time::Duration;
use tauri::Emitter;

#[derive(Serialize, Clone)]
pub struct FsEventInfo {
    pub kind: String,
    pub paths: Vec<String>,
}

#[derive(Default)]
pub struct WatcherState(std::sync::Mutex<Option<RecommendedWatcher>>);

fn kind_name(kind: &EventKind) -> &'static str {
    match kind {
        EventKind::Create(_) => "create",
        EventKind::Modify(_) => "modify",
        EventKind::Remove(_) => "remove",
        _ => "other",
    }
}

fn collect(event: &notify::Result<Event>, batch: &mut Vec<FsEventInfo>) {
    let Ok(event) = event else { return };
    let kind = kind_name(&event.kind).to_string();
    let paths: Vec<String> = event
        .paths
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    if paths.is_empty() {
        return;
    }
    // Coalesce: same kind + same paths already in batch → skip.
    if batch.iter().any(|b| b.kind == kind && b.paths == paths) {
        return;
    }
    batch.push(FsEventInfo { kind, paths });
}

/// Watches the prompt library recursively and emits debounced "fs-events" batches.
/// Replacing the watcher (calling this command again) stops the previous one.
#[tauri::command]
pub fn start_watcher(
    root: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let (tx, rx) = mpsc::channel::<notify::Result<Event>>();
    let mut watcher = notify::recommended_watcher(tx).map_err(|e| e.to_string())?;
    watcher
        .watch(Path::new(&root), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;
    // Dropping the previous watcher stops its backend; its thread exits when tx drops.
    *state.0.lock().unwrap() = Some(watcher);

    std::thread::spawn(move || {
        loop {
            let first = match rx.recv() {
                Ok(e) => e,
                Err(_) => break, // channel closed: watcher was replaced or app shut down
            };
            let mut batch: Vec<FsEventInfo> = Vec::new();
            collect(&first, &mut batch);
            // Debounce window: gather everything arriving within 300ms of the first event.
            while let Ok(next) = rx.recv_timeout(Duration::from_millis(300)) {
                collect(&next, &mut batch);
            }
            if batch.is_empty() {
                continue;
            }
            let _ = app.emit("fs-events", batch);
        }
    });

    Ok(())
}
