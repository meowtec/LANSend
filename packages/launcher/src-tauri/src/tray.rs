use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu};

use crate::window::reopen_window;

pub fn init_tray(app: &tauri::App) {
    let handle = app.handle();
    let tray_menu =
        SystemTrayMenu::new().add_item(CustomMenuItem::new("quit".to_string(), "Quit".to_string()));

    #[allow(unused_mut)]
    let mut tray = SystemTray::new().with_menu(tray_menu);

    #[cfg(target_os = "macos")]
    {
        tray = tray.with_icon(tauri::Icon::Raw(
            include_bytes!("../icons/icon_tray.png").to_vec(),
        ));
    }

    tray.on_event(move |event| match event {
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
