use actix_web::cookie::Key;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn get_now_mils() -> u32 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u32
}

pub fn create_key_from_str(str: &str) -> Key {
    let mut bytes = str.to_string().into_bytes();
    let min_size = 64;

    if bytes.len() < min_size {
        bytes.resize(min_size, 0);
    }

    Key::from(&bytes)
}
