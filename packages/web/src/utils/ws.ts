import { EventEmitter } from 'eventemitter3';
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

interface Events {
  message: WebSocketServerMessage;
  open: void;
  close: void;
}

export class WS extends EventEmitter<keyof Events> {
  private status : 'lost' | 'connecting' | 'connected' | 'closed' = 'lost';

  private instance?: WebSocket;

  private sendingMessageQueue: string[] = [];

  constructor() {
    super();

    this.connect();
  }

  on<T extends keyof Events>(type: T, listener: (payload: Events[T]) => void): this {
    return super.on(type, listener);
  }

  emit<T extends keyof Events>(type: T, payload: Events[T]): boolean {
    return super.emit(type, payload);
  }

  sendMessage<T extends ClientMessageType>(
    type: T,
    content: WebSocketClientMessageMap[T],
  ) {
    const message = createWebSocketMessageBody(type, content);
    if (this.instance && this.status === 'connected') {
      this.instance.send(message);
    } else {
      this.sendingMessageQueue.push(message);
    }
  }

  private flush() {
    this.sendingMessageQueue.forEach((message) => {
      this.instance?.send(message);
    });
    this.sendingMessageQueue = [];
  }

  private connect() {
    if (this.status === 'connecting') {
      return;
    }
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    this.instance = ws;
    this.status = 'connecting';

    ws.addEventListener('open', () => {
      if (ws !== this.instance) return;
      this.status = 'connected';
      this.flush();
      this.emit('open', undefined);
    });

    ws.addEventListener('close', () => {
      if (ws !== this.instance) return;
      this.status = 'lost';
      this.emit('close', undefined);

      setTimeout(() => {
        if (this.status !== 'closed') {
          this.connect();
        }
      }, 2000);
    });

    ws.addEventListener('message', (event) => {
      if (ws !== this.instance) return;
      console.log('message:', event);
      const message = parseWebSocketMessageBody<WebSocketServerMessage>(event.data as string);
      console.log('emit', message);
      if (!message) return;

      this.emit('message', message);
    });
  }

  close() {
    this.status = 'closed';
    this.instance?.close();
  }
}
