use actix::{Actor, AsyncContext, Context, Handler};
use nanoid::nanoid;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use crate::{
    file::{FileManager, UserFile},
    messages::{
        MailDataDetailed, MailDataOutline, MailWithSender, PostOfficeMessage,
        PostOfficeMessageGetUsers, WsMessageToClient,
    },
    user::{online_users::OnlineUsers, User},
};

#[derive(Clone)]
pub struct PostOffice {
    online_users: Arc<Mutex<OnlineUsers>>,
    file_manager: FileManager,
}

impl PostOffice {
    pub fn new(file_manager: FileManager) -> Self {
        Self {
            online_users: Arc::new(Mutex::new(OnlineUsers::new())),
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
            act.online_users.lock().unwrap().broadcast_users_if_needed();
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
        self.online_users.lock().unwrap().get_user_list()
    }
}

impl Handler<PostOfficeMessage> for PostOffice {
    type Result = ();

    fn handle(&mut self, msg: PostOfficeMessage, _: &mut Self::Context) -> Self::Result {
        log::debug!("PostOffice actor handle {:?}", &msg);
        let mut inner = self.online_users.lock().unwrap();

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
                                    .online_users
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
