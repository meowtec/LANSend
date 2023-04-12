use actix::{Addr, Message};
use serde::{Deserialize, Serialize};

use crate::{file::UserFile, session::WsSession, user::User};

/// WsSession Actor 收到的消息
#[derive(Message, Serialize, Debug)]
#[rtype(result = "()")]
pub enum WsSessionMessage {
    /// 发送到客户端的 websocket message
    WsMessage(WsMessageToClient),
}

/// 邮件
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", content = "content", rename_all = "snake_case")]
pub enum MailDataDetailed {
    Text(String),
    LongText(UserFile),
    File(UserFile),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", content = "content", rename_all = "snake_case")]
pub enum MailDataOutline {
    Text(String),
    LongText(String),
    File(String),
}

/// 由客户端用户发送到服务器的邮件
#[derive(Deserialize, Clone, Debug)]
pub struct MailWithReceivers {
    /// 消息接收人，多个
    pub receivers: Vec<String>,
    /// 消息内容
    pub data: MailDataOutline,
}

/// 由服务器发送给用户的邮件
#[derive(Serialize, Clone, Debug)]
pub struct MailWithSender {
    pub id: String,
    /// 创建时间，毫秒
    pub create_date: u32,
    /// 消息发送人
    pub sender: String,
    /// 消息内容
    pub data: MailDataDetailed,
}

/// 服务器发送给用户的 ws message
#[derive(Serialize, Clone, Debug)]
#[serde(tag = "type", content = "content", rename_all = "snake_case")]
pub enum WsMessageToClient {
    /// 当前登录全部用户列表
    Users(Vec<User>),

    /// 邮件
    Mail(MailWithSender),
}

/// 用户发送给服务器的 ws message
#[derive(Deserialize, Clone, Debug)]
#[serde(tag = "type", content = "content", rename_all = "snake_case")]
pub enum WsMessageToServer {
    /// 邮件
    Mail(MailWithReceivers),
}

/// Square Actor 收到的消息
#[derive(Message, Debug)]
#[rtype(result = "Vec<User>")]
pub struct PostOfficeMessageGetUsers;

/// Square Actor 收到的消息
#[derive(Message, Debug)]
#[rtype(result = "()")]
pub enum PostOfficeMessage {
    /// session 加入
    Connect {
        user_id: String,
        session_id: String,
        session_addr: Addr<WsSession>,
    },
    /// session 断开
    Disconnect { user_id: String, session_id: String },
    /// session 之间发邮件
    Mail {
        sender_id: String,
        time: u32,
        mail: MailWithReceivers,
    },
    /// 更新用户信息
    UpdateUser(User),
}
