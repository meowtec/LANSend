use std::time::Duration;

use actix::{clock::Instant, Actor, ActorContext, Addr, AsyncContext, Handler, StreamHandler};
use actix_web_actors::ws;
use nanoid::nanoid;

use crate::{
    center::PostOffice,
    messages::{MailWithReceivers, PostOfficeMessage, WsMessageToServer, WsSessionMessage},
    utils::get_now_mils,
};

pub struct WsSession {
    office: Addr<PostOffice>,
    user_id: String,
    session_id: String,
    heartbeat_time: Instant,
}

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(500);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(3000);

impl WsSession {
    pub fn new(user_id: String, office: Addr<PostOffice>) -> Self {
        log::info!("Create session for user {}", &user_id);
        WsSession {
            session_id: nanoid!(),
            user_id,
            office,
            heartbeat_time: Instant::now(),
        }
    }

    fn reset_heartbeat_time(&mut self) {
        self.heartbeat_time = Instant::now();
    }

    fn send_msg(&self, mail: MailWithReceivers) {
        log::info!("Send mail {:?} from {}", &mail, self.user_id);
        self.office.do_send(PostOfficeMessage::Mail {
            sender_id: self.user_id.to_string(),
            time: get_now_mils(),
            mail,
        });
    }

    fn connect_to_office(&self, addr: Addr<Self>) {
        self.office.do_send(PostOfficeMessage::Connect {
            user_id: self.user_id.to_string(),
            session_id: self.session_id.to_string(),
            session_addr: addr,
        });
    }

    fn disconnect_from_office(&self) {
        log::info!(
            "Send disconnect message to office, session_id: {}",
            self.session_id
        );
        self.office.do_send(PostOfficeMessage::Disconnect {
            user_id: self.user_id.to_string(),
            session_id: self.session_id.to_string(),
        });
    }

    fn start_interval(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            log::debug!("Websocket Client heartbeat: {:?}", act.heartbeat_time);
            if Instant::now().duration_since(act.heartbeat_time) > CLIENT_TIMEOUT {
                log::warn!("Websocket Client heartbeat failed, disconnecting!");
                ctx.stop();
            }

            ctx.ping(b"hi");
        });
    }

    fn handle_message(&self, msg: WsMessageToServer) {
        match msg {
            WsMessageToServer::Mail(mail) => {
                self.send_msg(mail);
            }
        }
    }
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.connect_to_office(ctx.address());
        self.start_interval(ctx);
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        self.disconnect_from_office();
    }
}

impl Handler<WsSessionMessage> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: WsSessionMessage, ctx: &mut Self::Context) -> Self::Result {
        log::debug!("WsSession actor handle: {:?}", &msg);

        match msg {
            WsSessionMessage::WsMessage(ws_message) => {
                // TODO performance
                ctx.text(serde_json::to_string(&ws_message).unwrap())
            }
        }
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, item: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        log::debug!("WsSession ws stream handle: {:?}", item);
        if let Ok(message) = item {
            self.reset_heartbeat_time();
            match message {
                ws::Message::Continuation(item) => {
                    log::warn!(
                        "Unsupported message type: Continuation({:?}), session_id: {}",
                        item,
                        self.session_id
                    );
                }
                ws::Message::Ping(msg) => {
                    ctx.pong(&msg);
                    self.reset_heartbeat_time();
                }
                ws::Message::Pong(_) => {
                    self.reset_heartbeat_time();
                }
                ws::Message::Close(reason) => {
                    log::warn!(
                        "Close session from client, reason: {:?}, session_id: {}",
                        reason,
                        self.session_id
                    );
                    ctx.close(reason);
                }
                ws::Message::Text(text) => {
                    let result = serde_json::from_slice::<WsMessageToServer>(text.as_bytes());
                    log::info!("Handle text message, session_id: {}", self.session_id);
                    if let Ok(msg) = result {
                        self.handle_message(msg);
                    }
                }
                _ => {}
            }
        }
    }
}
