import { MailReceive, MailSend, User } from './entity';

export interface WsMessage<T, D> {
  type: T;
  content: D;
}

export type WebSocketClientMessageMap = {
  mail: MailSend;
};

export type WebSocketServerMessageMap = {
  users: User[];
  mail: MailReceive;
};

type GetMessageType<M> = keyof M extends infer U
  ? U extends keyof M
    ? WsMessage<U, M[U]>
    : never
  : never;

export type WebSocketServerMessage = GetMessageType<WebSocketServerMessageMap>;

export type WebSocketClientMessage = GetMessageType<WebSocketClientMessageMap>;

export type ClientMessageType = keyof WebSocketClientMessageMap;

export type ServerMessageType = keyof WebSocketServerMessageMap;
