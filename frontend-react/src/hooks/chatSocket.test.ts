import { describe, expect, it, vi } from 'vitest';
import { emitChatSocketForTest, subscribeChatSocket } from './chatSocket';

describe('chatSocket', () => {
  it('delivers mocked chat events to subscribers and supports unsubscribe', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeChatSocket('chat:message', handler);

    emitChatSocketForTest('chat:message', {
      conversationId: 'c1',
      message: { id: 'm1', content: 'hello', sentAt: '2026-06-10T07:00:00Z' },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 'c1' }));

    unsubscribe();
    emitChatSocketForTest('chat:message', {
      conversationId: 'c1',
      message: { id: 'm2', content: 'ignored', sentAt: '2026-06-10T07:01:00Z' },
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
