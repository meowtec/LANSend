import {
  ClientMessageType,
  ServerMessageType,
  WebSocketClientMessage,
  WebSocketClientMessageMap,
  WebSocketServerMessage,
  WebSocketServerMessageMap,
  WsMessage,
} from '#/types/ws';

export function createWebSocketMessageBody<T extends ClientMessageType>(
  type: T,
  content: WebSocketClientMessageMap[T],
): string;

export function createWebSocketMessageBody<T extends ServerMessageType>(
  type: T,
  content: WebSocketServerMessageMap[T],
): string;

export function createWebSocketMessageBody<T extends ClientMessageType | ServerMessageType>(
  type: T,
  content: unknown,
): string {
  const message: WsMessage<T, unknown> = { type, content };
  return JSON.stringify(message);
}

export function parseWebSocketMessageBody<T extends WebSocketServerMessage | WebSocketClientMessage>(
  data: string,
): T | null {
  if (typeof data !== 'string') {
    return null;
  }

  try {
    return JSON.parse(data) as T;
  } catch (err) { /* */ }

  return null;
}

export function createWs() {
  const ws = new WebSocket(`ws://${window.location.host}/ws`);

  const sendMessage = <T extends ClientMessageType>(
    type: T,
    content: WebSocketClientMessageMap[T],
  ) => {
    ws.send(createWebSocketMessageBody(type, content));
  };

  return {
    instance: ws,
    sendMessage,
  };
}
