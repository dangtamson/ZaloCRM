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
const { renderHtmlTemplateToImage } = await import('../src/modules/automation/engine/html-image-template.js');

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.contact.findFirst.mockResolvedValue({
    id: 'contact-1',
    fullName: 'Nguyen Van A',
    crmName: 'Anh A',
    phone: '0912345678',
    status: 'new',
    tags: ['vip'],
    birthDate: new Date('1990-01-02T00:00:00.000Z'),
    gender: 'male',
    occupation: 'CEO',
  });
  prismaMock.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Zalo CRM' });
  prismaMock.conversation.findUnique.mockResolvedValue(null);
  prismaMock.conversation.create.mockResolvedValue({ id: 'conversation-1' });
  prismaMock.message.create.mockResolvedValue({
    id: 'message-1',
    content: 'Xin chao Anh A tu Zalo CRM',
    contentType: 'text',
    sentAt: new Date('2026-06-08T00:00:00.000Z'),
  });
  prismaMock.zaloAccount.findFirst.mockResolvedValue({ id: 'nick-1' });
  prismaMock.zaloAccount.update.mockResolvedValue({});
  zaloOpsMock.sendMessage.mockResolvedValue({ message: { msgId: 'zmsg-1' } });
  zaloOpsMock.sendImage.mockResolvedValue({ message: { msgId: 'zimg-1' } });
  vi.mocked(renderHtmlTemplateToImage).mockResolvedValue({
    url: 'https://crm.example.test/automation-assets/org-1/card.png',
    filePath: '/tmp/card.png',
  });
});

describe('sendMessageHandler group target with template', () => {
  it('renders the block template and sends it to the configured group thread', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['Xin chao {{contact.crmName}} tu {{org.name}}'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(zaloOpsMock.sendMessage).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      { msg: 'Xin chao Anh A tu Zalo CRM' },
    );
    expect(prismaMock.friend.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.conversation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        orgId: 'org-1',
        zaloAccountId: 'nick-1',
        externalThreadId: 'group-123',
        threadType: 'group',
        contactId: null,
      }),
    }));
  });

  it('renders htmlImageTemplate and sends the rendered image to the group', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['Xin chao {{contact.crmName}} tu {{org.name}}'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
        htmlImageTemplate: {
          html: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"></svg>',
          width: 320,
          height: 180,
          failOpen: false,
        },
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(renderHtmlTemplateToImage).toHaveBeenCalledWith(expect.objectContaining({
      orgId: 'org-1',
      htmlTemplate: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"></svg>',
      width: 320,
      height: 180,
    }));
    expect(zaloOpsMock.sendFile).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      ['/tmp/card.png'],
      null,
      'Xin chao Anh A tu Zalo CRM',
    );
    expect(zaloOpsMock.sendImage).not.toHaveBeenCalled();
    expect(zaloOpsMock.sendMessage).not.toHaveBeenCalled();
    expect(prismaMock.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        contentType: 'image',
      }),
    }));
  });

  it('uses customer-list profile override when rendering message templates', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['Chuc mung {{contact.fullName}} - {{contact.occupation}}'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
        __templateContactOverride: {
          fullName: 'Anh Tran Trong B',
          crmName: 'Anh Tran Trong B',
          occupation: 'Truong phong',
        },
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(zaloOpsMock.sendMessage).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      { msg: 'Chuc mung Anh Tran Trong B - Truong phong' },
    );
  });

  it('uses customer-list unit override when rendering message templates', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['Don vi {{contact.unit}} - {{contact.fullName}}'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
        __templateContactOverride: {
          fullName: 'Anh Tran Trong B',
          unit: 'Phong Khach Hang Doanh Nghiep',
        },
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(zaloOpsMock.sendMessage).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      { msg: 'Don vi Phong Khach Hang Doanh Nghiep - Anh Tran Trong B' },
    );
  });

  it('uses custom birthday wish override when rendering message templates', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['{{contact.fullName}}: {{contact.birthdayWish}}'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
        __templateContactOverride: {
          fullName: 'Anh Tran Trong B',
          birthdayWish: 'Chúc anh luôn mạnh khỏe, hạnh phúc và thành công.',
        },
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(zaloOpsMock.sendMessage).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      { msg: 'Anh Tran Trong B: Chúc anh luôn mạnh khỏe, hạnh phúc và thành công.' },
    );
  });

  it('falls back to default birthday wish when override is empty', async () => {
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['{{contact.birthdayWishLine1}} / {{contact.birthdayWishLine3}}'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
        __templateContactOverride: {
          fullName: 'Anh Tran Trong B',
          gender: 'male',
          unit: 'Don vi A',
        },
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(zaloOpsMock.sendMessage).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      { msg: 'Nhân dịp sinh nhật của Anh, kính chúc Anh luôn / dẫn dắt Don vi A phát triển vững mạnh,' },
    );
  });

  it('renders multiple customer-list profiles into one multi-image group message', async () => {
    vi.mocked(renderHtmlTemplateToImage)
      .mockResolvedValueOnce({
        url: 'https://crm.example.test/automation-assets/org-1/card-1.png',
        filePath: '/tmp/card-1.png',
      })
      .mockResolvedValueOnce({
        url: 'https://crm.example.test/automation-assets/org-1/card-2.png',
        filePath: '/tmp/card-2.png',
      })
      .mockResolvedValueOnce({
        url: 'https://crm.example.test/automation-assets/org-1/card-3.png',
        filePath: '/tmp/card-3.png',
      });
    const ctx: ActionContext = {
      orgId: 'org-1',
      taskId: 'task-1',
      contactId: 'contact-1',
      assignedNickId: 'nick-1',
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: {
        textVariants: ['Chuc mung sinh nhat'],
        groupTarget: { accountId: 'nick-1', groupId: 'group-123' },
        htmlImageTemplate: {
          html: '<svg>{{contact.fullName}} {{contact.occupation}}</svg>',
          width: 960,
          height: 1280,
          failOpen: false,
        },
        __templateContactOverrides: [
          { fullName: 'Anh A', crmName: 'Anh A', occupation: 'Giam doc' },
          { fullName: 'Chi B', crmName: 'Chi B', occupation: 'Ke toan' },
          { fullName: 'Anh C', crmName: 'Anh C', occupation: 'Ky thuat' },
        ],
      },
    };

    const result = await sendMessageHandler(ctx);

    expect(result.outcome).toBe('success');
    expect(renderHtmlTemplateToImage).toHaveBeenCalledTimes(3);
    expect(renderHtmlTemplateToImage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      context: expect.objectContaining({
        contact: expect.objectContaining({ fullName: 'Anh A', occupation: 'Giam doc' }),
      }),
    }));
    expect(renderHtmlTemplateToImage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      context: expect.objectContaining({
        contact: expect.objectContaining({ fullName: 'Chi B', occupation: 'Ke toan' }),
      }),
    }));
    expect(renderHtmlTemplateToImage).toHaveBeenNthCalledWith(3, expect.objectContaining({
      context: expect.objectContaining({
        contact: expect.objectContaining({ fullName: 'Anh C', occupation: 'Ky thuat' }),
      }),
    }));
    expect(zaloOpsMock.sendFile).toHaveBeenCalledWith(
      'nick-1',
      'group-123',
      1,
      ['/tmp/card-1.png', '/tmp/card-2.png', '/tmp/card-3.png'],
      null,
      'Chuc mung sinh nhat',
    );
    expect(zaloOpsMock.sendMessage).not.toHaveBeenCalled();
  });
});
