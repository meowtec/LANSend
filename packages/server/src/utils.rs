use std::time::{SystemTime, UNIX_EPOCH};

pub fn get_now_mils() -> u32 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u32
}
