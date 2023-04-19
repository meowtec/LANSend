use std::collections::HashMap;

use actix::Addr;

use crate::{session::WsSession, user::User};

#[derive(Default)]
pub struct OnlineUser {
    pub user: Option<User>,
    pub sessions: HashMap<String, Addr<WsSession>>,
}

pub struct OnlineUsers {
    /// users has been modified and need to broadcast to all users
    pub modified: bool,
    pub users: HashMap<String, OnlineUser>,
}
