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
    square: Addr<PostOffice>,
    user_id: String,
    session_id: String,
    heartbeat_time: Instant,
}

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(500);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(3000);

impl WsSession {
    pub fn new(user_id: String, square: Addr<PostOffice>) -> Self {
        log::info!("create session for user {}", &user_id);
        WsSession {
            session_id: nanoid!(),
            user_id,
            square,
            heartbeat_time: Instant::now(),
        }
    }

    fn reset_heartbeat_time(&mut self) {
        self.heartbeat_time = Instant::now();
    }

    fn send_msg(&self, mail: MailWithReceivers) {
        log::info!("send mail {:?} from {}", &mail, self.user_id);
        self.square.do_send(PostOfficeMessage::Mail {
            sender_id: self.user_id.to_string(),
            time: get_now_mils(),
            mail,
        });
    }

    fn connect_to_square(&self, addr: Addr<Self>) {
        self.square.do_send(PostOfficeMessage::Connect {
            user_id: self.user_id.to_string(),
            session_id: self.session_id.to_string(),
            session_addr: addr,
        });
    }

    fn disconnect_from_square(&self) {
        log::info!("Session {} send disconnect message", self.session_id);
        self.square.do_send(PostOfficeMessage::Disconnect {
            user_id: self.user_id.to_string(),
            session_id: self.session_id.to_string(),
        });
    }

    fn start_interval(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.heartbeat_time) > CLIENT_TIMEOUT {
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
        self.connect_to_square(ctx.address());
        self.start_interval(ctx);
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        self.disconnect_from_square();
    }
}

impl Handler<WsSessionMessage> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: WsSessionMessage, ctx: &mut Self::Context) -> Self::Result {
        log::info!("WsSession handle: {:?}", &msg);

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
        log::info!("WsSession handle ws: {:?}", item);
        if let Ok(message) = item {
            self.reset_heartbeat_time();
            match message {
                ws::Message::Continuation(_) => {
                    // TODO unsupported
                }
                ws::Message::Ping(msg) => {
                    ctx.pong(&msg);
                    self.reset_heartbeat_time();
                }
                ws::Message::Pong(_) => {
                    self.reset_heartbeat_time();
                }
                ws::Message::Close(reason) => {
                    ctx.close(reason);
                }
                ws::Message::Text(text) => {
                    let result = serde_json::from_slice::<WsMessageToServer>(text.as_bytes());
                    log::info!("{:?}", result);
                    if let Ok(msg) = result {
                        self.handle_message(msg);
                    }
                }
                _ => {}
            }
        }
    }
}
