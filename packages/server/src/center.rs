use actix::{Actor, Addr, AsyncContext, Context, Handler};
use indexmap::IndexMap as HashMap;
use nanoid::nanoid;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use crate::{
    file::{FileManager, UserFile},
    messages::{
        MailDataDetailed, MailDataOutline, MailWithSender, PostOfficeMessage,
        PostOfficeMessageGetUsers, WsMessageToClient, WsSessionMessage,
    },
    session::WsSession,
    user::User,
};

#[derive(Default)]
struct UserContainer {
    user: Option<User>,
    sessions: HashMap<String, Addr<WsSession>>,
}

struct PostOfficeInner {
    /// users has been modified and need to broadcast to all users
    modified: bool,
    users: HashMap<String, UserContainer>,
}

impl PostOfficeInner {
    pub fn new() -> Self {
        Self {
            modified: false,
            users: HashMap::new(),
        }
    }

    fn get_user_container(&self, user_id: &str) -> Option<&UserContainer> {
        self.users.get(user_id)
    }

    fn get_user_container_or_insert(&mut self, user_id: &str) -> &mut UserContainer {
        self.users
            .entry(user_id.to_string())
            .or_insert_with(Default::default)
    }

    fn get_user_list(&self) -> Vec<User> {
        self.users
            .iter()
            .filter_map(|(_, user)| match user.sessions.is_empty() {
                true => None,
                false => user.user.clone(),
            })
            .collect::<Vec<User>>()
    }

    fn add_session(&mut self, user_id: &str, session_id: &str, session_addr: Addr<WsSession>) {
        self.get_user_container_or_insert(user_id)
            .sessions
            .insert(session_id.to_string(), session_addr);

        self.modified = true;
    }

    fn remove_session(&mut self, user_id: &str, session_id: &str) {
        if let Some(user) = self.users.get_mut(user_id) {
            user.sessions.remove(session_id);
        }

        self.modified = true;
    }

    fn update_user_info(&mut self, user: User) {
        let mut user_container = self.get_user_container_or_insert(&user.id);
        user_container.user = Some(user);

        self.modified = true;
    }

    fn send_message_to_all(&self, msg: &WsMessageToClient) {
        self.users.values().for_each(|user| {
            self.send_message_to_user(user, msg);
        })
    }

    fn send_message_to_user(&self, user: &UserContainer, msg: &WsMessageToClient) -> bool {
        if user.sessions.is_empty() {
            return false;
        }

        user.sessions.iter().for_each(|(_, addr)| {
            addr.do_send(WsSessionMessage::WsMessage(msg.clone()));
        });

        true
    }

    fn send_message_to_uid(&self, user_id: &str, msg: &WsMessageToClient) -> bool {
        let user_op = self.get_user_container(user_id);
        let user = match user_op {
            Some(user) => user,
            None => {
                return false;
            }
        };

        self.send_message_to_user(user, msg)
    }

    fn broadcast_users_if_needed(&mut self) {
        if !self.modified {
            return;
        }

        self.modified = false;

        let message = WsMessageToClient::Users(self.get_user_list());

        log::debug!("PostOffice actor broadcast to all users");
        self.send_message_to_all(&message);
    }
}

#[derive(Clone)]
pub struct PostOffice {
    inner: Arc<Mutex<PostOfficeInner>>,
    file_manager: FileManager,
}

impl PostOffice {
    pub fn new(file_manager: FileManager) -> Self {
        Self {
            inner: Arc::new(Mutex::new(PostOfficeInner::new())),
            file_manager,
        }
    }

    async fn get_file(&self, file_id: &str) -> Result<Option<UserFile>, anyhow::Error> {
        self.file_manager.get(file_id).await
    }

    async fn get_file_into(
        &self,
        file_id: &str,
        f: impl FnOnce(UserFile) -> MailDataDetailed,
    ) -> Result<MailDataDetailed, anyhow::Error> {
        if let Some(file) = self.get_file(file_id).await? {
            Ok(f(file))
        } else {
            Err(anyhow::anyhow!("file {} not found", file_id))
        }
    }

    async fn get_detailed_mail(
        &self,
        mail: &MailDataOutline,
    ) -> Result<MailDataDetailed, anyhow::Error> {
        match mail {
            MailDataOutline::Text(text) => Ok(MailDataDetailed::Text(text.to_string())),
            MailDataOutline::File(file_id) => {
                self.get_file_into(file_id, MailDataDetailed::File).await
            }
            MailDataOutline::LongText(file_id) => {
                self.get_file_into(file_id, MailDataDetailed::LongText)
                    .await
            }
        }
    }

    fn start_users_interval(&self, ctx: &mut Context<Self>) {
        // check user list every 2s, if modified, broadcast to all users
        ctx.run_interval(Duration::from_secs(2), |act, _ctx| {
            log::debug!("PostOffice actor check users");
            act.inner.lock().unwrap().broadcast_users_if_needed();
        });
    }
}

impl Actor for PostOffice {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        log::debug!("PostOffice actor started");
        self.start_users_interval(ctx);
    }
}

impl Handler<PostOfficeMessageGetUsers> for PostOffice {
    type Result = Vec<User>;

    fn handle(&mut self, _: PostOfficeMessageGetUsers, _: &mut Self::Context) -> Self::Result {
        self.inner.lock().unwrap().get_user_list()
    }
}

impl Handler<PostOfficeMessage> for PostOffice {
    type Result = ();

    fn handle(&mut self, msg: PostOfficeMessage, _: &mut Self::Context) -> Self::Result {
        log::debug!("PostOffice actor handle {:?}", &msg);
        let mut inner = self.inner.lock().unwrap();

        match msg {
            PostOfficeMessage::Connect {
                user_id,
                session_id,
                session_addr,
            } => {
                log::info!(
                    "Session add, session_id: {} , user_id: {}",
                    &session_id,
                    &user_id
                );
                inner.add_session(&user_id, &session_id, session_addr);
            }
            PostOfficeMessage::Disconnect {
                user_id,
                session_id,
            } => {
                log::info!(
                    "Session remove, session_id: {}, user_id: {}",
                    &session_id,
                    &user_id
                );
                inner.remove_session(&user_id, &session_id);
            }
            PostOfficeMessage::Mail {
                sender_id,
                time,
                mail,
            } => {
                let self_cloned = self.clone();

                log::debug!("PostOffice transmit mail from {}: {:?}", sender_id, &mail);

                tokio::spawn(async move {
                    let may_mail_detail = self_cloned.get_detailed_mail(&mail.data).await;

                    match may_mail_detail {
                        Ok(mail_detail) => {
                            let mail_msg = WsMessageToClient::Mail(MailWithSender {
                                id: nanoid!(),
                                create_date: time,
                                sender: sender_id.to_string(),
                                data: mail_detail,
                            });
                            mail.receivers.iter().for_each(|receiver_id| {
                                self_cloned
                                    .inner
                                    .lock()
                                    .unwrap()
                                    .send_message_to_uid(receiver_id, &mail_msg);
                            });
                        }
                        Err(err) => {
                            log::error!("PostOffice get mail detailed error: {}", err);
                        }
                    }
                });
            }
            PostOfficeMessage::UpdateUser(user) => inner.update_user_info(user),
        }
    }
}
