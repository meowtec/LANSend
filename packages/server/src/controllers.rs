use std::io::ErrorKind;

use crate::{
    center::PostOffice,
    file::{FileManager, UserFile},
    messages::{PostOfficeMessage, PostOfficeMessageGetUsers},
    response::{MyResponse, ResponseResult},
    session::WsSession,
    user::User,
};
use actix::Addr;
use actix_files::NamedFile;
use actix_session::Session;
use actix_web::{get, post, web, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UploadQuery {
    pub filename: String,
}

#[post("/file/upload")]
pub async fn file_upload(
    payload: web::Payload,
    query: web::Query<UploadQuery>,
    file_manager: web::Data<FileManager>,
    session: Session,
) -> ResponseResult<UserFile> {
    let user = User::get_from_session(&session).map_err(anyhow::Error::from)?;
    let file = file_manager
        .add_from_stream(payload, query.filename.to_string(), user.id)
        .await?;
    MyResponse::ok(file)
}

#[get("/file/{id}")]
pub async fn file_download(
    id: web::Path<String>,
    file_manager: web::Data<FileManager>,
) -> std::io::Result<NamedFile> {
    let (file, _) = file_manager
        .get_named_file(&id)
        .await
        .map_err(|e| std::io::Error::new(ErrorKind::NotFound, e))?;
    Ok(file)
}

#[get("/user-info")]
pub async fn user_info(session: Session) -> ResponseResult<User> {
    let user = User::get_from_session(&session).map_err(anyhow::Error::from)?;
    MyResponse::ok(user)
}

#[post("/user-info")]
pub async fn update_user_info(
    payload: web::Json<User>,
    session: Session,
    square: web::Data<Addr<PostOffice>>,
) -> ResponseResult<User> {
    let mut user = User::get_from_session(&session).map_err(anyhow::Error::from)?;
    // Update current user info, payload.id will be excluded
    user.update(payload.into_inner());
    user.insert_to_session(&session)
        .map_err(anyhow::Error::from)?;
    square
        .send(PostOfficeMessage::UpdateUser(user.clone()))
        .await
        .map_err(anyhow::Error::from)?;

    MyResponse::ok(user)
}

#[get("/users")]
pub async fn user_list(square: web::Data<Addr<PostOffice>>) -> ResponseResult<Vec<User>> {
    let users = square
        .send(PostOfficeMessageGetUsers)
        .await
        .map_err(anyhow::Error::from)?;
    MyResponse::ok(users)
}

#[get("/ws")]
pub async fn websocket(
    req: HttpRequest,
    session: Session,
    stream: web::Payload,
    square: web::Data<Addr<PostOffice>>,
) -> Result<HttpResponse, actix_web::Error> {
    let user = User::get_from_session(&session)?;

    log::info!("to square send UpdateUser");
    square.do_send(PostOfficeMessage::UpdateUser(user.clone()));
    let rep = ws::start(
        WsSession::new(user.id, square.get_ref().clone()),
        &req,
        stream,
    )?;
    Ok(rep)
}
