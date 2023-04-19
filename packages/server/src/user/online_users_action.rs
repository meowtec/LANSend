use crate::messages::{WsMessageToClient, WsSessionMessage};

use super::online_users::{OnlineUser, OnlineUsers};

impl OnlineUsers {
    fn send_message_to_all(&self, msg: &WsMessageToClient) {
        self.users.values().for_each(|user| {
            self.send_message_to_user(user, msg);
        })
    }

    fn send_message_to_user(&self, user: &OnlineUser, msg: &WsMessageToClient) -> bool {
        if user.sessions.is_empty() {
            return false;
        }

        user.sessions.iter().for_each(|(_, addr)| {
            addr.do_send(WsSessionMessage::WsMessage(msg.clone()));
        });

        true
    }

    pub fn send_message_to_uid(&self, user_id: &str, msg: &WsMessageToClient) -> bool {
        let user_op = self.get_online_user(user_id);
        let user = match user_op {
            Some(user) => user,
            None => {
                return false;
            }
        };

        self.send_message_to_user(user, msg)
    }

    pub fn broadcast_users_if_needed(&mut self) {
        if !self.modified {
            return;
        }

        self.modified = false;

        let message = WsMessageToClient::Users(self.get_user_list());

        log::debug!("PostOffice actor broadcast to all users");
        self.send_message_to_all(&message);
    }
}
