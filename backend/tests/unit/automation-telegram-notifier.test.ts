import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  integration: { findFirst: vi.fn() },
};

vi.mock('../../src/shared/database/prisma-client.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../src/shared/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const { notifyAutomationRunTelegram } = await import('../../src/modules/automation/engine/automation-telegram-notifier.js');

describe('notifyAutomationRunTelegram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('OK'),
    }));
  });

  it('sends a success notification through the enabled Telegram integration', async () => {
    prismaMock.integration.findFirst.mockResolvedValueOnce({
      id: 'integration-1',
      config: {
        botToken: 'token-1',
        chatId: '-100123',
        messageThreadId: '456',
      },
    });

    await notifyAutomationRunTelegram({
      orgId: 'org-1',
      status: 'success',
      mode: 'worker',
      taskId: 'task-1',
      actionType: 'send_message',
      contactId: 'contact-1',
      triggerName: 'Sinh nhật tuần này',
    });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      chat_id: '-100123',
      parse_mode: 'Markdown',
      message_thread_id: 456,
    });
    expect(JSON.parse(String(init?.body)).text).toContain('Automation chạy thành công');
    expect(JSON.parse(String(init?.body)).text).toContain('task-1');
    expect(JSON.parse(String(init?.body)).text).toContain('Sinh nhật tuần này');
  });

  it('sends through the selected Telegram integration when integrationId is provided', async () => {
    prismaMock.integration.findFirst.mockResolvedValueOnce({
      id: 'telegram-selected',
      config: {
        botToken: 'token-selected',
        chatId: '-100999',
        messageThreadId: '789',
      },
    });

    await notifyAutomationRunTelegram({
      orgId: 'org-1',
      status: 'success',
      mode: 'manual',
      triggerName: 'Cron hằng ngày',
      telegramIntegrationId: 'telegram-selected',
    });

    expect(prismaMock.integration.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'telegram-selected',
        orgId: 'org-1',
        type: 'telegram',
        enabled: true,
      },
    }));
    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      chat_id: '-100999',
      message_thread_id: 789,
    });
  });

  it('sends a failure notification with error detail', async () => {
    prismaMock.integration.findFirst.mockResolvedValueOnce({
      id: 'integration-1',
      config: {
        botToken: 'token-1',
        chatId: '-100123',
      },
    });

    await notifyAutomationRunTelegram({
      orgId: 'org-1',
      status: 'failed',
      mode: 'manual',
      taskId: 'manual-trigger-1',
      actionType: 'send_message',
      errorMessage: 'SEND_MESSAGE_FAILED: not connected',
    });

    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body)).text).toContain('Automation chạy lỗi');
    expect(JSON.parse(String(init?.body)).text).toContain('SEND_MESSAGE_FAILED: not connected');
  });

  it('does nothing when the org has no enabled Telegram integration', async () => {
    prismaMock.integration.findFirst.mockResolvedValueOnce(null);

    await notifyAutomationRunTelegram({
      orgId: 'org-1',
      status: 'success',
      mode: 'worker',
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
