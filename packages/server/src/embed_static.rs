use std::path::Path;

use actix_web::{get, HttpRequest, HttpResponse, Responder};
use include_dir::{include_dir, Dir};
use mime_guess::mime;

static PROJECT_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../web/dist");

#[get("/{filename:.*}")]
pub async fn serve_static(req: HttpRequest) -> impl Responder {
    let file_path = req.match_info().query("filename");
    println!("file_path: {}", file_path);

    let file = PROJECT_DIR
        .get_file(file_path)
        .or_else(|| PROJECT_DIR.get_file(Path::new(file_path).join("index.html")));

    if let Some(file) = file {
        HttpResponse::Ok()
            .content_type(
                mime_guess::from_path(file.path())
                    .first_or(mime::TEXT_PLAIN)
                    .as_ref(),
            )
            .body(file.contents_utf8().unwrap())
    } else {
        HttpResponse::NotFound().body("404 NOT FOUND")
    }
}
