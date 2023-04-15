mod ip;
mod platform;
#[cfg(desktop)]
mod tray;
#[cfg(desktop)]
mod window;

use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use ip::NetInterface;
use lansend_server::LansendServerMonitor;
use local_ip_address::list_afinet_netifas;
use tauri::{Manager, RunEvent, State};
use tauri_plugin_log::LogTarget;
use tokio::sync::{Mutex as AsyncMutex, MutexGuard as AsyncMutexGuard};
use window::reopen_window;

#[derive(Clone)]
struct AppState(Arc<Mutex<Option<PathBuf>>>);

#[derive(Debug, Clone)]
struct ServerState(Arc<AsyncMutex<Option<LansendServerMonitor>>>);

impl ServerState {
    async fn get_mutex_guard(&self) -> AsyncMutexGuard<Option<LansendServerMonitor>> {
        self.0.lock().await
    }

    pub fn init_with_app_dir(&self, dir: PathBuf) {
        self.0
            .blocking_lock()
            .replace(LansendServerMonitor::new(dir));
    }

    pub async fn start(&self, port: u16) -> Result<(), String> {
        let mut server_guard = self.get_mutex_guard().await;
        let server = server_guard.as_mut().unwrap();
        server.set_port(port);
        let start_result = server.start().await;

        start_result.map_err(|e| {
            log::error!("server start error: {}", e);
            e.to_string()
        })
    }

    pub async fn stop(&self) {
        let mut server_guard = self.get_mutex_guard().await;
        if let Some(server) = server_guard.as_mut() {
            server.stop().await;
        }
    }

    pub async fn is_running(&self) -> bool {
        let mut server_guard = self.get_mutex_guard().await;
        if let Some(server) = server_guard.as_mut() {
            server.is_running().await
        } else {
            false
        }
    }
}

#[tauri::command]
async fn start_server(port: u16, state: State<'_, ServerState>) -> Result<(), String> {
    state.start(port).await
}

#[tauri::command]
async fn stop_server(state: State<'_, ServerState>) -> Result<(), String> {
    state.stop().await;
    Ok(())
}

#[tauri::command]
async fn is_running(state: State<'_, ServerState>) -> Result<bool, String> {
    Ok(state.is_running().await)
}

#[tauri::command]
fn get_netifas() -> Result<Vec<NetInterface>, String> {
    list_afinet_netifas()
        .map(|list| list.into_iter().map(NetInterface::from).collect())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let server_state = ServerState(Arc::new(AsyncMutex::new(None)));

    let server_state_1 = server_state.clone();

    let app = tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            log::info!("other instance: {:?} {:?}", argv, cwd);
            reopen_window(&app.app_handle());
        }))
        .setup(move |app| {
            log::info!("setup app");
            #[cfg(desktop)]
            tray::init_tray(app);

            let config = app.config();
            let app_data_dir = platform::get_app_data_dir(&config)?;
            log::info!("app data dir: {:?}", app_data_dir);

            server_state_1.init_with_app_dir(app_data_dir);

            Ok(())
        })
        .manage(server_state)
        .invoke_handler(tauri::generate_handler![
            start_server,
            stop_server,
            is_running,
            get_netifas
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |_app_handle, event| {
        #[cfg(desktop)]
        if let RunEvent::ExitRequested { api, .. } = &event {
            log::info!("exit requested");
            // Keep the event loop running even if all windows are closed
            // This allow us to catch system tray events when there is no window
            api.prevent_exit();
        }
    })
}
