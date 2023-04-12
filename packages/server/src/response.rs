use std::error::Error as StdError;
use std::fmt::Display;

use actix_web::{
    body::BoxBody,
    http::{header::ContentType, StatusCode},
    HttpRequest, HttpResponse, Responder, ResponseError,
};
use serde::Serialize;

#[derive(Serialize, Debug, Default)]
pub enum ResponseErrorCode {
    #[default]
    Internal,
}

#[derive(Serialize, Debug)]
pub struct MyResponse<T: Serialize> {
    data: T,
}

impl<T: Serialize> MyResponse<T> {
    pub fn new(data: T) -> Self {
        MyResponse { data }
    }

    pub fn ok(data: T) -> ResponseResult<T> {
        Ok(MyResponse::new(data))
    }
}

#[derive(Serialize, Debug)]
pub struct MyResponseError {
    #[serde(skip_serializing)]
    error: Option<anyhow::Error>,
    #[serde(skip_serializing)]
    status_code: StatusCode,
    code: ResponseErrorCode,
    message: String,
}

impl MyResponseError {
    pub fn new<S: Into<String>>(
        status_code: Option<StatusCode>,
        code: Option<ResponseErrorCode>,
        message: S,
    ) -> Self {
        MyResponseError {
            error: None,
            status_code: status_code.unwrap_or_default(),
            code: code.unwrap_or_default(),
            message: message.into(),
        }
    }
}

impl From<StatusCode> for MyResponseError {
    fn from(status_code: StatusCode) -> Self {
        MyResponseError::new(
            Some(status_code),
            Some(ResponseErrorCode::Internal),
            status_code.canonical_reason().unwrap_or_default(),
        )
    }
}

impl StdError for MyResponseError {}

impl From<anyhow::Error> for MyResponseError {
    fn from(value: anyhow::Error) -> Self {
        MyResponseError {
            error: Some(value),
            status_code: StatusCode::INTERNAL_SERVER_ERROR,
            code: ResponseErrorCode::Internal,
            message: "System error".to_string(),
        }
    }
}

impl Display for MyResponseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "[HTTP {}][{}] {}; {}",
            self.status_code,
            serde_json::to_string(&self.code).unwrap_or_default(),
            self.message,
            match &self.error {
                Some(err) => err.to_string(),
                None => "".to_string(),
            },
        )
    }
}

impl<T: Serialize> Responder for MyResponse<T> {
    type Body = BoxBody;

    fn respond_to(self, _req: &HttpRequest) -> HttpResponse<Self::Body> {
        let body = serde_json::to_string(&self).unwrap();

        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body(body)
    }
}

impl ResponseError for MyResponseError {
    fn error_response(&self) -> HttpResponse {
        let body = serde_json::to_string(&self).unwrap();

        HttpResponse::build(self.status_code)
            .insert_header(ContentType::json())
            .body(body)
    }
}

pub type ResponseResult<T> = Result<MyResponse<T>, MyResponseError>;
