import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from '../types/chat';

export interface ChatMessageEvent {
  conversationId: string;
  message: ChatMessage;
  _privacyMeta?: { privacyMode?: string; ownerUserId?: string | null };
}

export interface ChatTypingEvent {
  conversationId: string;
  typers: Array<{ userId: string; userName: string }>;
}

type ChatSocketEvents = {
  'chat:message': ChatMessageEvent;
  'chat:typing': ChatTypingEvent;
};

type EventName = keyof ChatSocketEvents;
type Handler<T extends EventName> = (payload: ChatSocketEvents[T]) => void;

const handlers: { [K in EventName]: Set<Handler<K>> } = {
  'chat:message': new Set(),
  'chat:typing': new Set(),
};

let socket: Socket | null = null;

function ensureSocket(): Socket | null {
  if (import.meta.env.MODE === 'test') return null;
  if (!socket) {
    socket = io({ transports: ['websocket', 'polling'] });
    socket.on('chat:message', (payload: ChatMessageEvent) => emitLocal('chat:message', payload));
    socket.on('typing:update', (payload: ChatTypingEvent) => emitLocal('chat:typing', payload));
  }
  return socket;
}

function emitLocal<T extends EventName>(event: T, payload: ChatSocketEvents[T]): void {
  for (const handler of handlers[event]) {
    handler(payload);
  }
}

export function subscribeChatSocket<T extends EventName>(event: T, handler: Handler<T>): () => void {
  ensureSocket();
  handlers[event].add(handler);
  return () => {
    handlers[event].delete(handler);
  };
}

export function emitChatSocketForTest<T extends EventName>(event: T, payload: ChatSocketEvents[T]): void {
  emitLocal(event, payload);
}
