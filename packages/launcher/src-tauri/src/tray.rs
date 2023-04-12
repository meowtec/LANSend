use tauri::{AppHandle, Manager, SystemTray, SystemTrayEvent};

use tauri::{CustomMenuItem, SystemTrayMenu};

fn reopen_window(handle: &AppHandle) {
    if handle.get_window("main").is_none() {
        let win_config = handle.config().tauri.windows.get(0).unwrap().clone();

        tauri::WindowBuilder::new(handle, "main", win_config.url)
            .inner_size(win_config.width, win_config.height)
            .build()
            .unwrap();
    }
}

pub fn init_tray(app: &tauri::App) {
    let handle = app.handle();
    let tray_menu =
        SystemTrayMenu::new().add_item(CustomMenuItem::new("quit".to_string(), "Quit".to_string()));

    SystemTray::new()
        .with_menu(tray_menu)
        .on_event(move |event| match event {
            #[allow(clippy::single_match)]
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    handle.exit(0);
                }
                _ => {}
            },
            SystemTrayEvent::LeftClick { .. } => {
                reopen_window(&handle);
            }
            _ => {}
        })
        .build(app)
        .unwrap();
}
