use tauri::{AppHandle, Manager};

pub fn reopen_window(handle: &AppHandle) {
    match handle.get_window("main") {
        Some(win) => {
            win.show().ok();
            win.set_focus().ok();
        }
        None => {
            let win_config = handle.config().tauri.windows.get(0).unwrap().clone();

            tauri::WindowBuilder::new(handle, "main", win_config.url)
                .title(win_config.title)
                .inner_size(win_config.width, win_config.height)
                .build()
                .unwrap();
        }
    }
}
