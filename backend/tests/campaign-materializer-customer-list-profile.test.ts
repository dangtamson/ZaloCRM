// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  automationTrigger: { findMany: vi.fn() },
  block: { findFirst: vi.fn() },
  customerListEntry: { findMany: vi.fn() },
  contact: { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  automationCampaign: { findFirst: vi.fn(), create: vi.fn() },
  automationTask: { findFirst: vi.fn(), create: vi.fn() },
};
const notifyAutomationRunTelegramMock = vi.fn();

vi.mock('../src/shared/database/prisma-client.js', () => ({ prisma: prismaMock }));
vi.mock('../src/shared/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../src/modules/automation/engine/automation-telegram-notifier.js', () => ({
  notifyAutomationRunTelegram: notifyAutomationRunTelegramMock,
}));

const { materializeFromEvent } = await import('../src/modules/automation/engine/campaign-materializer.js');

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-08T02:00:00.000Z'));
  prismaMock.automationTrigger.findMany.mockResolvedValue([
    {
      id: 'trigger-1',
      eventType: 'scheduled_cron',
      enabled: true,
      bindingKind: 'block',
      blockId: 'block-1',
      eventFilter: null,
      segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayThisWeek: true },
      ruleOverrides: null,
      sequenceId: null,
      sequence: null,
    },
  ]);
  prismaMock.block.findFirst.mockResolvedValue({
    id: 'block-1',
    content: {
      textVariants: ['Chuc mung {{contact.fullName}} - {{contact.occupation}}'],
      htmlImageTemplate: { html: '<svg></svg>', width: 960, height: 1280 },
    },
    archivedAt: null,
  });
  prismaMock.customerListEntry.findMany.mockResolvedValue([
    {
      phoneE164: '+84901234567',
      contactId: 'contact-1',
      dupWithContactId: null,
      nameRaw: 'Anh Thai Quang Hieu',
      birthDate: new Date('1981-06-10T00:00:00.000Z'),
      gender: 'male',
      occupation: 'PGD VNPT CAN THO',
      unit: 'Trung tam Kinh doanh',
      birthdayWish: 'Chúc anh nhiều sức khỏe và luôn thành công.',
    },
  ]);
  prismaMock.contact.findMany.mockResolvedValue([]);
  prismaMock.contact.findFirst.mockResolvedValue({ id: 'sample-contact-1' });
  prismaMock.automationCampaign.findFirst.mockResolvedValue(null);
  prismaMock.automationCampaign.create.mockResolvedValue({ id: 'campaign-1' });
  prismaMock.automationTask.findFirst.mockResolvedValue(null);
  prismaMock.automationTask.create.mockResolvedValue({ id: 'task-1' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('campaign materializer customer-list profile templates', () => {
  it('stores customer-list nameRaw and occupation on the task block snapshot', async () => {
    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.automationTrigger.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        orgId: 'org-1',
        eventType: 'scheduled_cron',
        enabled: true,
        id: 'trigger-1',
      }),
    }));
    expect(prismaMock.contact.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: 'org-1',
        campaignId: 'campaign-1',
        contactId: 'contact-1',
        currentBlockId: 'block-1',
        blockSnapshot: expect.objectContaining({
          textVariants: ['Chuc mung {{contact.fullName}} - {{contact.occupation}}'],
          __templateContactOverride: {
            fullName: 'Anh Thai Quang Hieu',
            crmName: 'Anh Thai Quang Hieu',
            birthDate: '1981-06-10T00:00:00.000Z',
            gender: 'male',
            occupation: 'PGD VNPT CAN THO',
            unit: 'Trung tam Kinh doanh',
            birthdayWish: 'Chúc anh nhiều sức khỏe và luôn thành công.',
          },
        }),
      }),
    });
  });

  it('groups multiple birthday entries into one html-template task with multiple profile overrides', async () => {
    prismaMock.customerListEntry.findMany.mockResolvedValueOnce([
      {
        phoneE164: '+84901234567',
        contactId: 'contact-1',
        dupWithContactId: null,
        nameRaw: 'Anh Thai Quang Hieu',
        birthDate: new Date('1981-06-10T00:00:00.000Z'),
        gender: 'male',
        occupation: 'PGD VNPT CAN THO',
        unit: 'Don vi A',
        birthdayWish: 'Lời chúc riêng A',
      },
      {
        phoneE164: '+84907654321',
        contactId: 'contact-2',
        dupWithContactId: null,
        nameRaw: 'Chi Nguyen Thi B',
        birthDate: new Date('1990-06-11T00:00:00.000Z'),
        gender: 'female',
        occupation: 'Ke toan',
        unit: 'Don vi B',
        birthdayWish: null,
      },
      {
        phoneE164: '+84908887777',
        contactId: 'contact-3',
        dupWithContactId: null,
        nameRaw: 'Anh Le Van C',
        birthDate: new Date('1988-06-12T00:00:00.000Z'),
        gender: 'male',
        occupation: 'Ky thuat',
        unit: 'Don vi C',
      },
    ]);

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.automationTask.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: 'contact-1',
        blockSnapshot: expect.objectContaining({
          __templateContactOverrides: [
            {
              fullName: 'Anh Thai Quang Hieu',
              crmName: 'Anh Thai Quang Hieu',
              birthDate: '1981-06-10T00:00:00.000Z',
              gender: 'male',
              occupation: 'PGD VNPT CAN THO',
              unit: 'Don vi A',
              birthdayWish: 'Lời chúc riêng A',
            },
            {
              fullName: 'Chi Nguyen Thi B',
              crmName: 'Chi Nguyen Thi B',
              birthDate: '1990-06-11T00:00:00.000Z',
              gender: 'female',
              occupation: 'Ke toan',
              unit: 'Don vi B',
            },
            {
              fullName: 'Anh Le Van C',
              crmName: 'Anh Le Van C',
              birthDate: '1988-06-12T00:00:00.000Z',
              gender: 'male',
              occupation: 'Ky thuat',
              unit: 'Don vi C',
            },
          ],
        }),
      }),
    });
  });

  it('filters customer-list entries to birthdays today without scanning CRM contacts', async () => {
    prismaMock.automationTrigger.findMany.mockResolvedValueOnce([
      {
        id: 'trigger-1',
        eventType: 'scheduled_cron',
        enabled: true,
        bindingKind: 'block',
        blockId: 'block-1',
        eventFilter: null,
        segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayToday: true },
        ruleOverrides: null,
        sequenceId: null,
        sequence: null,
      },
    ]);
    prismaMock.customerListEntry.findMany.mockResolvedValueOnce([
      {
        phoneE164: '+84901111111',
        contactId: null,
        dupWithContactId: null,
        nameRaw: 'Anh Sinh Nhat Hom Nay',
        birthDate: new Date('1981-06-08T00:00:00.000Z'),
        gender: 'male',
        occupation: 'Giam doc',
        unit: 'Don vi A',
        birthdayWish: null,
      },
      {
        phoneE164: '+84902222222',
        contactId: null,
        dupWithContactId: null,
        nameRaw: 'Chi Sinh Nhat Ngay Khac',
        birthDate: new Date('1992-06-09T00:00:00.000Z'),
        gender: 'female',
        occupation: 'Nhan su',
        unit: 'Don vi B',
        birthdayWish: null,
      },
    ]);

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.contact.findMany).not.toHaveBeenCalled();
    expect(prismaMock.contact.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { orgId: 'org-1', mergedInto: null },
    }));
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: 'sample-contact-1',
        blockSnapshot: expect.objectContaining({
          __templateContactOverride: {
            fullName: 'Anh Sinh Nhat Hom Nay',
            crmName: 'Anh Sinh Nhat Hom Nay',
            birthDate: '1981-06-08T00:00:00.000Z',
            gender: 'male',
            occupation: 'Giam doc',
            unit: 'Don vi A',
          },
        }),
      }),
    });
  });

  it('notifies Telegram when birthday-today customer-list scan finds zero eligible entries', async () => {
    prismaMock.automationTrigger.findMany.mockResolvedValueOnce([
      {
        id: 'trigger-1',
        name: 'Sinh nhật hôm nay',
        eventType: 'scheduled_cron',
        enabled: true,
        bindingKind: 'block',
        blockId: 'block-1',
        eventFilter: null,
        segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayToday: true },
        ruleOverrides: {
          telegramMessageTarget: { integrationId: 'telegram-1' },
        },
        sequenceId: null,
        sequence: null,
      },
    ]);
    prismaMock.customerListEntry.findMany.mockResolvedValueOnce([
      {
        phoneE164: '+84902222222',
        contactId: null,
        dupWithContactId: null,
        nameRaw: 'Chi Sinh Nhat Ngay Khac',
        birthDate: new Date('1992-06-09T00:00:00.000Z'),
        gender: 'female',
        occupation: 'Nhan su',
        unit: 'Don vi B',
        birthdayWish: null,
      },
    ]);

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.noopSuccesses).toBe(1);
    expect(result.reasons).not.toContain('trigger trigger-1: no contacts resolved (block-bound)');
    expect(prismaMock.automationTask.create).not.toHaveBeenCalled();
    expect(notifyAutomationRunTelegramMock).toHaveBeenCalledWith(expect.objectContaining({
      orgId: 'org-1',
      status: 'success',
      mode: 'worker',
      triggerName: 'Sinh nhật hôm nay',
      actionType: 'Kiểm tra sinh nhật tệp người dùng',
      telegramIntegrationId: 'telegram-1',
      extraLines: [
        'Điều kiện: Sinh nhật trong ngày hôm nay',
        'Số người thỏa điều kiện: 0',
      ],
    }));
  });

  it('ignores CRM contact birthday events for customer-list birthday triggers', async () => {
    prismaMock.automationTrigger.findMany.mockResolvedValueOnce([
      {
        id: 'trigger-1',
        eventType: 'birthday',
        enabled: true,
        bindingKind: 'block',
        blockId: 'block-1',
        eventFilter: null,
        segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayToday: true },
        ruleOverrides: null,
        sequenceId: null,
        sequence: null,
      },
    ]);

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'birthday',
      contactId: 'crm-contact-1',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { month: 6, day: 8 },
    });

    expect(result.tasksEnqueued).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.reasons).toContain('trigger trigger-1: customer-list birthday trigger ignores CRM contact birthday event');
    expect(prismaMock.customerListEntry.findMany).not.toHaveBeenCalled();
    expect(prismaMock.contact.findMany).not.toHaveBeenCalled();
    expect(prismaMock.automationTask.create).not.toHaveBeenCalled();
  });

  it('includes customer-list birthday entries that are not linked to CRM contacts', async () => {
    prismaMock.customerListEntry.findMany.mockResolvedValueOnce([
      {
        phoneE164: '+84901111111',
        contactId: 'contact-1',
        dupWithContactId: null,
        nameRaw: 'Anh CRM Linked',
        birthDate: new Date('1981-06-10T00:00:00.000Z'),
        gender: 'male',
        occupation: 'Giam doc',
        unit: 'Don vi CRM',
      },
      {
        phoneE164: '+84902222222',
        contactId: null,
        dupWithContactId: null,
        nameRaw: 'Chi Chua Co CRM',
        birthDate: new Date('1992-06-11T00:00:00.000Z'),
        gender: 'female',
        occupation: 'Nhan su',
        unit: 'Don vi ngoai CRM',
      },
    ]);
    prismaMock.contact.findMany.mockResolvedValueOnce([]);

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: 'contact-1',
        blockSnapshot: expect.objectContaining({
          __templateContactOverrides: [
            expect.objectContaining({
              fullName: 'Anh CRM Linked',
              occupation: 'Giam doc',
              unit: 'Don vi CRM',
            }),
            expect.objectContaining({
              fullName: 'Chi Chua Co CRM',
              occupation: 'Nhan su',
              unit: 'Don vi ngoai CRM',
            }),
          ],
        }),
      }),
    });
  });

  it('uses a sample contact as task anchor when birthday entries are not CRM contacts', async () => {
    prismaMock.customerListEntry.findMany.mockResolvedValueOnce([
      {
        phoneE164: '+84903333333',
        contactId: null,
        dupWithContactId: null,
        nameRaw: 'Anh Ngoai CRM',
        birthDate: new Date('1985-06-13T00:00:00.000Z'),
        gender: 'male',
        occupation: 'Kinh doanh',
        unit: 'Don vi mau',
      },
    ]);
    prismaMock.contact.findMany.mockResolvedValueOnce([]);
    prismaMock.contact.findFirst.mockResolvedValueOnce({ id: 'sample-contact-1' });

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.contact.findFirst).toHaveBeenCalledWith({
      where: { orgId: 'org-1', mergedInto: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: 'sample-contact-1',
        blockSnapshot: expect.objectContaining({
          __templateContactOverride: {
            fullName: 'Anh Ngoai CRM',
            crmName: 'Anh Ngoai CRM',
            birthDate: '1985-06-13T00:00:00.000Z',
            gender: 'male',
            occupation: 'Kinh doanh',
            unit: 'Don vi mau',
          },
        }),
      }),
    });
  });

  it('applies send message targets from trigger ruleOverrides to block snapshots', async () => {
    prismaMock.automationTrigger.findMany.mockResolvedValueOnce([
      {
        id: 'trigger-1',
        eventType: 'scheduled_cron',
        enabled: true,
        bindingKind: 'block',
        blockId: 'block-1',
        eventFilter: null,
        segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayThisWeek: true },
        ruleOverrides: {
          telegramMessageTarget: { integrationId: 'telegram-1' },
          sendMessageTargets: {
            groupTargets: [{ accountId: 'nick-trigger', groupId: 'group-trigger' }],
            userTargets: [{ accountId: 'nick-user', contactId: 'contact-user' }],
          },
        },
        sequenceId: null,
        sequence: null,
      },
    ]);
    prismaMock.block.findFirst.mockResolvedValueOnce({
      id: 'block-1',
      content: {
        textVariants: ['Chuc mung {{contact.fullName}}'],
        groupTarget: { accountId: 'nick-legacy', groupId: 'group-legacy' },
        htmlImageTemplate: { html: '<svg></svg>', width: 960, height: 1280 },
      },
      archivedAt: null,
    });

    const result = await materializeFromEvent({
      id: 'event-1',
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.automationTask.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        campaignId: 'campaign-1',
        contactId: 'contact-user',
      }),
    }));
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: 'contact-user',
        blockSnapshot: expect.objectContaining({
          telegramMessageTarget: { integrationId: 'telegram-1' },
          groupTargets: [{ accountId: 'nick-trigger', groupId: 'group-trigger' }],
          userTargets: [{ accountId: 'nick-user', contactId: 'contact-user' }],
        }),
      }),
    });
    const snapshot = prismaMock.automationTask.create.mock.calls[0][0].data.blockSnapshot;
    expect(snapshot.groupTarget).toBeUndefined();
  });

  it('can disable block campaign dedup via ruleOverrides', async () => {
    prismaMock.automationTrigger.findMany.mockResolvedValueOnce([
      {
        id: 'trigger-1',
        eventType: 'scheduled_cron',
        enabled: true,
        bindingKind: 'block',
        blockId: 'block-1',
        eventFilter: null,
        segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayThisWeek: true },
        ruleOverrides: {
          dedupBlockCampaign: false,
          sendMessageTargets: {
            userTargets: [{ accountId: 'nick-user', contactId: 'contact-user' }],
          },
        },
        sequenceId: null,
        sequence: null,
      },
    ]);

    prismaMock.block.findFirst.mockResolvedValueOnce({
      id: 'block-1',
      content: {
        textVariants: ['Chuc mung {{contact.fullName}}'],
      },
      archivedAt: null,
    });

    prismaMock.automationTask.findFirst.mockResolvedValueOnce({ id: 'existing-task' });

    const result = await materializeFromEvent({
      orgId: 'org-1',
      type: 'scheduled_cron',
      occurredAt: new Date('2026-06-08T02:00:00.000Z'),
      payload: { triggerId: 'trigger-1' },
    });

    expect(result.tasksEnqueued).toBe(1);
    expect(prismaMock.automationTask.findFirst).toHaveBeenCalledTimes(0);
    expect(prismaMock.automationTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactId: 'contact-user',
      }),
    });
  });
});
