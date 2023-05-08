use tauri::{AppHandle, Manager};

pub fn reopen_window(handle: &AppHandle) {
    match handle.get_window("main") {
        Some(win) => {
            win.show().ok();
            win.set_focus().ok();
        }
        None => {
            tauri::WindowBuilder::from_config(
                handle,
                handle.config().tauri.windows.get(0).unwrap().clone(),
            )
            .build()
            .unwrap();
        }
    }
}
