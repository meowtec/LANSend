use tauri::{SystemTray, SystemTrayEvent};

use tauri::{CustomMenuItem, SystemTrayMenu};

use crate::window::reopen_window;

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
