use crate::{
    center::PostOffice,
    controllers,
    embed_static::serve_static,
    file::{DataDir, FileManager},
};
use actix::Actor;
use actix_session::{
    config::{PersistentSession, TtlExtensionPolicy},
    storage::CookieSessionStore,
    SessionMiddleware,
};
use actix_web::{cookie::Key, dev::Server, web, App, HttpServer};
use anyhow::anyhow;
use std::{fmt::Debug, path::PathBuf};

#[derive(Clone)]
pub struct LansendServer {
    port: u16,
    data_dir: DataDir,
    key: Option<Key>,
}

impl Debug for LansendServer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LansendServer")
            .field("port", &self.port)
            .field("data_dir", &self.data_dir)
            .finish()
    }
}

impl LansendServer {
    pub fn new(port: u16, data_dir: PathBuf) -> Self {
        Self {
            port,
            data_dir: DataDir::new(data_dir),
            key: None,
        }
    }

    pub fn set_port(&mut self, port: u16) {
        self.port = port;
    }

    pub async fn run(&self) -> Result<Server, anyhow::Error> {
        log::info!("Serve at http://127.0.0.1:{}", self.port);
        let port = self.port;
        let data_dir = self.data_dir.clone();
        data_dir.ensure_dirs().await?;
        log::info!("Data dir is: {:?}", &data_dir.path());

        let key = match self.key.as_ref() {
            Some(key) => key.clone(),
            None => self.data_dir.get_key_or_create().await?,
        };

        let db = sled::open(data_dir.db_path())?;

        let file_manager = FileManager::new(data_dir.files_dir(), db)
            .ensure_dir()
            .await?;

        let http_server = HttpServer::new(move || {
            let post_office = PostOffice::new(file_manager.clone()).start();

            App::new()
                .wrap(
                    SessionMiddleware::builder(CookieSessionStore::default(), key.clone())
                        .cookie_secure(false)
                        .session_lifecycle(
                            PersistentSession::default()
                                .session_ttl(actix_web::cookie::time::Duration::days(120))
                                .session_ttl_extension_policy(TtlExtensionPolicy::OnEveryRequest),
                        )
                        .build(),
                )
                .service(
                    web::scope("/api")
                        .app_data(web::Data::new(file_manager.clone()))
                        .service(controllers::user_info)
                        .service(controllers::user_list)
                        .service(controllers::file_upload)
                        .service(controllers::file_download)
                        .service(controllers::update_user_info),
                )
                .app_data(web::Data::new(post_office))
                .service(controllers::websocket)
                .service(serve_static)
        })
        .system_exit()
        .shutdown_timeout(5)
        .bind(("0.0.0.0", port))
        .map_err(|err| anyhow!(err).context("Failed to bind port"))?;

        Ok(http_server.run())
    }
}
