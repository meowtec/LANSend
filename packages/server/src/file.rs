use actix_files::NamedFile;
use actix_web::cookie::Key;
use actix_web::http::header::{ContentDisposition, DispositionParam, DispositionType};
use actix_web::web::Bytes;
use futures_core::stream::Stream;
use futures_util::stream::StreamExt;
use mime::{self, Mime};
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use sled::Db;
use std::error::Error as StdError;
use std::{
    io,
    path::{Path, PathBuf},
};
use tokio::{fs, io::AsyncWriteExt};

#[derive(Debug, Clone)]
pub struct DataDir(PathBuf);

impl DataDir {
    pub fn new(dir: PathBuf) -> Self {
        DataDir(dir)
    }

    pub async fn ensure_dirs(&self) -> io::Result<()> {
        fs::create_dir_all(self.files_dir()).await?;
        Ok(())
    }

    pub fn key_path(&self) -> PathBuf {
        self.0.join("KEY")
    }

    pub fn db_path(&self) -> PathBuf {
        self.0.join("db-path")
    }

    pub fn files_dir(&self) -> PathBuf {
        self.0.join("files")
    }

    pub fn path(&self) -> &Path {
        &self.0
    }

    pub async fn get_key_or_create(&self) -> Result<Key, anyhow::Error> {
        let key_path = self.key_path();
        if key_path.exists() {
            let key = tokio::fs::read(&key_path).await?;
            if key.len() >= 64 {
                return Ok(Key::from(&key));
            }
        }

        let key = Key::generate();
        tokio::fs::write(&key_path, key.master()).await?;
        Ok(key)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserFile {
    id: String,
    name: String,
    size: i64, // 大小, bytes
    user_id: String,
}

impl UserFile {
    pub fn file_path_in(&self, dir: &Path) -> PathBuf {
        dir.join(&self.id)
    }

    pub fn new(user_id: String) -> Self {
        UserFile {
            id: nanoid!(),
            name: Default::default(),
            size: Default::default(),
            user_id,
        }
    }

    pub fn mime(&self) -> Mime {
        mime_guess::from_path(&self.name).first_or_octet_stream()
    }
}

#[derive(Debug, Clone)]
pub struct FileManager {
    dir: PathBuf,
    db: Db,
}

impl FileManager {
    pub fn new(dir: PathBuf, db: Db) -> Self {
        FileManager { dir, db }
    }

    pub async fn ensure_dir(self) -> io::Result<Self> {
        let dir_metadata = tokio::fs::metadata(&self.dir).await;
        if dir_metadata.map_or(false, |m| !m.is_dir()) {
            tokio::fs::create_dir(&self.dir).await?;
        }

        Ok(self)
    }

    #[allow(dead_code)]
    pub async fn clear(self) -> io::Result<Self> {
        let dir = &self.dir;

        if tokio::fs::metadata(dir).await.is_ok() {
            tokio::fs::remove_dir_all(dir).await?;
            tokio::fs::create_dir(&dir).await?;
        }

        Ok(self)
    }

    pub async fn insert(&self, file: UserFile) -> Result<(), anyhow::Error> {
        self.db
            .insert(&file.id, serde_json::to_string(&file)?.as_bytes())?;
        Ok(())
    }

    pub async fn get(&self, id: &str) -> Result<Option<UserFile>, anyhow::Error> {
        let option_result = self.db.get(id)?;
        if let Some(result) = option_result {
            let file = serde_json::from_slice(&result)?;
            Ok(Some(file))
        } else {
            Ok(None)
        }
    }

    pub async fn add_from_stream<S, E>(
        &self,
        stream: S,
        filename: String,
        user_id: String,
    ) -> Result<UserFile, anyhow::Error>
    where
        E: StdError + Send + Sync + 'static,
        S: Stream<Item = Result<Bytes, E>>,
    {
        let mut user_file = UserFile::new(user_id);

        let mut file = fs::File::create(self.get_file_path(&user_file)).await?;
        let mut stream_pinned = Box::pin(stream);

        while let Some(chunk_res) = stream_pinned.next().await {
            let chunk = chunk_res?;
            file.write_all(&chunk).await?;
        }
        file.flush().await?;

        user_file.name = filename;
        user_file.size = file.metadata().await?.len() as i64;

        self.insert(user_file.clone()).await?;

        Ok(user_file)
    }

    pub async fn get_named_file(&self, id: &str) -> anyhow::Result<(NamedFile, String)> {
        let file = self
            .get(id)
            .await?
            .ok_or(anyhow::anyhow!("file {} not found", id))?;
        let mime = file.mime();
        let file_name = file.name.clone();

        let mut named_file = NamedFile::open_async(self.get_file_path(&file))
            .await?
            .set_content_disposition(ContentDisposition {
                disposition: DispositionType::Inline,
                parameters: vec![DispositionParam::Filename(file_name.clone())],
            });

        if !mime.as_ref().starts_with("text/html") {
            named_file = named_file.set_content_type(mime);
        }

        Ok((named_file, file_name))
    }

    pub fn get_file_path(&self, file: &UserFile) -> PathBuf {
        file.file_path_in(&self.dir)
    }
}
