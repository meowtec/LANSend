use crate::server::LansendServer;
use actix_web::dev::ServerHandle;
use std::{ops::Deref, path::PathBuf, sync::Arc};
use tokio::sync::oneshot;
use tokio::sync::Mutex as AsyncMutex;
use tokio::task::JoinHandle;

#[derive(Debug)]
pub struct LansendServerMonitor {
    lansend_server: LansendServer,
    server_process: Option<JoinHandle<()>>,
    server_handle: Arc<AsyncMutex<Option<ServerHandle>>>,
}

impl LansendServerMonitor {
    pub fn new(data_path: PathBuf) -> Self {
        LansendServerMonitor {
            lansend_server: LansendServer::new(8080, data_path),
            server_process: Default::default(),
            server_handle: Default::default(),
        }
    }

    pub fn set_port(&mut self, port: u16) {
        self.lansend_server.set_port(port);
    }

    pub async fn is_running(&self) -> bool {
        self.server_handle.lock().await.is_some()
    }

    pub async fn start(&mut self) -> Result<(), anyhow::Error> {
        if self.is_running().await {
            return Err(anyhow::anyhow!("server is already running"));
        }

        let lansend_server = self.lansend_server.clone();
        let server_handle = self.server_handle.clone();

        let (tx, rx) = oneshot::channel();

        std::thread::spawn(move || {
            let rt = actix_web::rt::System::new();
            rt.block_on(async {
                log::info!("Server starting...");
                let server = match lansend_server.run().await {
                    Ok(server) => server,
                    Err(e) => {
                        log::error!("Server start error: {}", e);
                        tx.send(Err(e)).unwrap();
                        return;
                    }
                };
                server_handle.lock().await.replace(server.handle());
                tx.send(Ok(())).unwrap();
                // server run and wait to exit
                let server_exit_result = server.await;
                // server exit
                log::info!("Server exit with {:?}.", server_exit_result);
                server_handle.lock().await.take();
            });
        });

        rx.await.unwrap()
    }

    pub async fn stop(&mut self) {
        match self.server_handle.lock().await.deref() {
            Some(handle) => handle.stop(false).await,
            None => (),
        }
        self.server_handle.lock().await.take();
    }
}

impl Drop for LansendServerMonitor {
    fn drop(&mut self) {
        if let Some(p) = &self.server_process {
            p.abort()
        }
    }
}
