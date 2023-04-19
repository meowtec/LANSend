use std::collections::HashMap;

use actix::Addr;

use crate::session::WsSession;

use super::{
    online_users::{OnlineUser, OnlineUsers},
    User,
};

impl OnlineUsers {
    pub fn new() -> Self {
        Self {
            modified: false,
            users: HashMap::new(),
        }
    }

    pub fn get_online_user(&self, user_id: &str) -> Option<&OnlineUser> {
        self.users.get(user_id)
    }

    fn get_online_user_or_insert(&mut self, user_id: &str) -> &mut OnlineUser {
        self.users
            .entry(user_id.to_string())
            .or_insert_with(Default::default)
    }

    pub fn get_user_list(&self) -> Vec<User> {
        self.users
            .iter()
            .filter_map(|(_, user)| user.user.clone())
            .collect::<Vec<User>>()
    }

    pub fn add_session(&mut self, user_id: &str, session_id: &str, session_addr: Addr<WsSession>) {
        self.get_online_user_or_insert(user_id)
            .sessions
            .insert(session_id.to_string(), session_addr);

        self.modified = true;
    }

    pub fn remove_session(&mut self, user_id: &str, session_id: &str) {
        if let Some(user) = self.users.get_mut(user_id) {
            user.sessions.remove(session_id);
        }

        self.modified = true;
    }

    pub fn update_user_info(&mut self, user: User) {
        let mut user_container = self.get_online_user_or_insert(&user.id);
        user_container.user = Some(user);

        self.modified = true;
    }
}
