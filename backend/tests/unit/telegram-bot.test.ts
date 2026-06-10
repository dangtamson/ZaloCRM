import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  contact: { count: vi.fn() },
  message: { count: vi.fn() },
  appointment: { count: vi.fn() },
};

vi.mock('../../src/shared/database/prisma-client.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../src/shared/utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const { sendTelegramNotification } = await import('../../src/modules/integrations/providers/telegram-bot.js');

describe('sendTelegramNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.contact.count.mockResolvedValue(1);
    prismaMock.message.count.mockResolvedValue(2);
    prismaMock.appointment.count.mockResolvedValue(3);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK'),
    }));
  });

  it('passes message_thread_id to Telegram when messageThreadId is configured', async () => {
    const result = await sendTelegramNotification('org-1', {
      botToken: 'token-1',
      chatId: '-100123',
      messageThreadId: '456',
    });

    expect(result.status).toBe('success');
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      chat_id: '-100123',
      parse_mode: 'Markdown',
      message_thread_id: 456,
    });
  });

  it('keeps Telegram payload backward compatible when messageThreadId is empty', async () => {
    await sendTelegramNotification('org-1', {
      botToken: 'token-1',
      chatId: '-100123',
      messageThreadId: '',
    });

    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('message_thread_id');
  });
});
