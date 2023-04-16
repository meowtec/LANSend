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
    req: HttpRequest,
    payload: web::Payload,
    query: web::Query<UploadQuery>,
    file_manager: web::Data<FileManager>,
    session: Session,
) -> ResponseResult<UserFile> {
    let user = User::get_from_session(&session, &req).map_err(anyhow::Error::from)?;
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
pub async fn user_info(req: HttpRequest, session: Session) -> ResponseResult<User> {
    let user = User::get_from_session(&session, &req).map_err(anyhow::Error::from)?;
    MyResponse::ok(user)
}

#[post("/user-info")]
pub async fn update_user_info(
    req: HttpRequest,
    payload: web::Json<User>,
    session: Session,
    office: web::Data<Addr<PostOffice>>,
) -> ResponseResult<User> {
    let mut user = User::get_from_session(&session, &req).map_err(anyhow::Error::from)?;
    // Update current user info, payload.id will be excluded
    user.update(payload.into_inner());
    user.insert_to_session(&session)
        .map_err(anyhow::Error::from)?;
    office
        .send(PostOfficeMessage::UpdateUser(user.clone()))
        .await
        .map_err(anyhow::Error::from)?;

    MyResponse::ok(user)
}

#[get("/users")]
pub async fn user_list(office: web::Data<Addr<PostOffice>>) -> ResponseResult<Vec<User>> {
    let users = office
        .send(PostOfficeMessageGetUsers)
        .await
        .map_err(anyhow::Error::from)?;
    log::debug!("GET /users: users count: {}", users.len());
    MyResponse::ok(users)
}

#[get("/ws")]
pub async fn websocket(
    req: HttpRequest,
    session: Session,
    stream: web::Payload,
    office: web::Data<Addr<PostOffice>>,
) -> Result<HttpResponse, actix_web::Error> {
    let user = User::get_from_session(&session, &req)?;

    log::info!(
        "CONNECT /ws: websocket connected from user: {} {}",
        user.user_name,
        user.id
    );
    office.do_send(PostOfficeMessage::UpdateUser(user.clone()));
    let rep = ws::start(
        WsSession::new(user.id, office.get_ref().clone()),
        &req,
        stream,
    )?;
    Ok(rep)
}
