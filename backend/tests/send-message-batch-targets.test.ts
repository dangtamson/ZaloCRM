import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ActionContext } from '../src/modules/automation/engine/types.js';

const prismaMock = {
  contact: { findFirst: vi.fn() },
  organization: { findUnique: vi.fn() },
  friend: { findFirst: vi.fn() },
  conversation: { findUnique: vi.fn(), create: vi.fn() },
  message: { create: vi.fn() },
  zaloAccount: { findFirst: vi.fn(), update: vi.fn() },
};

const zaloOpsMock = {
  sendMessage: vi.fn(),
  sendImage: vi.fn(),
  sendVideo: vi.fn(),
  sendFile: vi.fn(),
  sendLink: vi.fn(),
};

vi.mock('../src/shared/database/prisma-client.js', () => ({ prisma: prismaMock }));
vi.mock('../src/shared/zalo-operations.js', () => ({ zaloOps: zaloOpsMock }));
vi.mock('../src/shared/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../src/modules/contacts/contact-aggregate.js', () => ({
  applyContactAggregateFromMessage: vi.fn(),
  applyFriendAggregate: vi.fn(),
}));
vi.mock('../src/modules/ai/image-service.js', () => ({
  generateAndStoreImage: vi.fn(),
}));
vi.mock('../src/modules/automation/engine/html-image-template.js', () => ({
  renderHtmlTemplateToImage: vi.fn(),
}));

const { sendMessageHandler } = await import('../src/modules/automation/engine/action-handlers/send-message.js');

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.spyOn(globalThis, 'setTimeout');
  prismaMock.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Zalo CRM' });
  prismaMock.conversation.findUnique.mockResolvedValue(null);
  prismaMock.conversation.create.mockImplementation(async ({ data }: any) => ({ id: `conv-${data.externalThreadId}` }));
  prismaMock.message.create.mockImplementation(async ({ data }: any) => ({
    id: `msg-${data.conversationId}`,
    content: data.content,
    contentType: data.contentType,
    sentAt: data.sentAt,
  }));
  prismaMock.zaloAccount.findFirst.mockImplementation(async ({ where }: any) => ({ id: where.OR?.[0]?.id ?? where.id ?? 'nick-1' }));
  prismaMock.zaloAccount.update.mockResolvedValue({});
  zaloOpsMock.sendMessage.mockImplementation(async () => ({ message: { msgId: `msg-${zaloOpsMock.sendMessage.mock.calls.length}` } }));
  prismaMock.contact.findFirst.mockImplementation(async ({ where }: any) => {
    if (where.id === 'contact-1') return { id: 'contact-1', fullName: 'Nguyen Van A', crmName: 'Anh A', phone: '0912345678', status: 'new', tags: [] };
    if (where.id === 'contact-2') return { id: 'contact-2', fullName: 'Tran Thi B', crmName: 'Chi B', phone: '0987654321', status: 'new', tags: [] };
    return { id: 'contact-fallback', fullName: 'Fallback', crmName: 'Fallback', phone: '0900000000', status: 'new', tags: [] };
  });
  prismaMock.friend.findFirst.mockImplementation(async ({ where }: any) => {
    if (where.contactId === 'contact-1') return { id: 'friend-1', zaloUidInNick: 'uid-1', friendshipStatus: 'accepted', hasConversation: true };
    if (where.contactId === 'contact-2') return { id: 'friend-2', zaloUidInNick: 'uid-2', friendshipStatus: 'accepted', hasConversation: true };
    return { id: 'friend-fallback', zaloUidInNick: 'uid-fallback', friendshipStatus: 'accepted', hasConversation: true };
  });
});

describe('sendMessageHandler batch targets', () => {
  it('sends group and user targets sequentially with a delay between sends', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-fallback',
      assignedNickId: null,
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['Xin chao {{contact.crmName}}'],
        groupTargets: [
          { accountId: 'nick-group-1', groupId: 'group-1' },
          { accountId: 'nick-group-2', groupId: 'group-2' },
        ],
        userTargets: [
          { accountId: 'nick-user-1', contactId: 'contact-1' },
        ],
      },
    };

    const promise = sendMessageHandler(ctx);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.outcome).toBe('success');
    expect(zaloOpsMock.sendMessage).toHaveBeenCalledTimes(3);
    expect(zaloOpsMock.sendMessage).toHaveBeenNthCalledWith(1, 'nick-group-1', 'group-1', 1, { msg: 'Xin chao Fallback' });
    expect(zaloOpsMock.sendMessage).toHaveBeenNthCalledWith(2, 'nick-group-2', 'group-2', 1, { msg: 'Xin chao Fallback' });
    expect(zaloOpsMock.sendMessage).toHaveBeenNthCalledWith(3, 'nick-user-1', 'uid-1', 0, { msg: 'Xin chao Fallback' });
    expect(globalThis.setTimeout).toHaveBeenCalledTimes(2);
  });
});
