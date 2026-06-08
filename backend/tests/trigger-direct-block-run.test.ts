import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

const prismaMock = {
  automationTrigger: { findFirst: vi.fn() },
  block: { findFirst: vi.fn() },
  contact: { findFirst: vi.fn() },
  zaloAccount: { findFirst: vi.fn() },
};

const sendMessageHandlerMock = vi.fn();
const eventEmitMock = vi.fn();
const materializeFromEventMock = vi.fn();

vi.mock('../src/shared/database/prisma-client.js', () => ({ prisma: prismaMock }));
vi.mock('../src/modules/auth/auth-middleware.js', () => ({
  authMiddleware: async (req: any) => {
    req.user = { id: 'user-1', orgId: 'org-1', role: 'admin', email: 'admin@example.test' };
  },
}));
vi.mock('../src/modules/auth/role-middleware.js', () => ({
  requireRole: () => async () => undefined,
}));
vi.mock('../src/shared/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../src/modules/automation/engine/event-bus.js', () => ({
  automationEventBus: { emit: eventEmitMock },
}));
vi.mock('../src/modules/automation/engine/cron-event-scheduler.js', () => ({
  registerCronTrigger: vi.fn(),
  unregisterCronTrigger: vi.fn(),
}));
vi.mock('../src/modules/automation/engine/action-handlers/send-message.js', () => ({
  sendMessageHandler: sendMessageHandlerMock,
}));
vi.mock('../src/modules/automation/engine/campaign-materializer.js', () => ({
  materializeFromEvent: materializeFromEventMock,
}));

const { triggerRoutes } = await import('../src/modules/automation/triggers/trigger-routes.js');

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(triggerRoutes);
  await app.ready();
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.automationTrigger.findFirst.mockResolvedValue({
    id: 'trigger-1',
    eventType: 'manual_run',
    enabled: true,
    bindingKind: 'block',
    blockId: 'block-1',
    eventFilter: null,
    segmentSpec: null,
  });
  prismaMock.block.findFirst.mockResolvedValue({
    id: 'block-1',
    actionType: 'send_message',
    content: {
      textVariants: ['Xin chao {{contact.crmName}}'],
      groupTarget: { accountId: 'nick-1', groupId: 'group-1' },
    },
    archivedAt: null,
  });
  prismaMock.contact.findFirst.mockResolvedValue({ id: 'contact-sample-1' });
  prismaMock.zaloAccount.findFirst.mockResolvedValue({ id: 'nick-1' });
  sendMessageHandlerMock.mockResolvedValue({ outcome: 'success', data: { textUsed: 'Xin chao Anh A' } });
  materializeFromEventMock.mockResolvedValue({
    campaignsCreated: 1,
    tasksEnqueued: 1,
    skipped: 0,
    reasons: [],
  });
});

describe('POST /api/v1/automation/triggers/:id/run direct block test', () => {
  it('runs a group-target send_message block without requiring contactId', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: {},
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      accepted: true,
      triggerId: 'trigger-1',
      mode: 'direct_block_test',
      outcome: 'success',
    });
    expect(sendMessageHandlerMock).toHaveBeenCalledWith(expect.objectContaining({
      orgId: 'org-1',
      taskId: 'manual-trigger-1',
      contactId: 'contact-sample-1',
      assignedNickId: null,
      actionType: 'send_message',
      attemptCount: 0,
      blockSnapshot: expect.objectContaining({
        groupTarget: { accountId: 'nick-1', groupId: 'group-1' },
      }),
    }));
    expect(eventEmitMock).not.toHaveBeenCalled();
  });

  it('runs direct block test with send targets configured on the trigger', async () => {
    prismaMock.automationTrigger.findFirst.mockResolvedValueOnce({
      id: 'trigger-1',
      eventType: 'manual_run',
      enabled: true,
      bindingKind: 'block',
      blockId: 'block-1',
      eventFilter: null,
      segmentSpec: null,
      ruleOverrides: {
        sendMessageTargets: {
          groupTargets: [{ accountId: 'nick-2', groupId: 'group-2' }],
        },
      },
    });
    prismaMock.block.findFirst.mockResolvedValueOnce({
      id: 'block-1',
      actionType: 'send_message',
      content: {
        textVariants: ['Xin chao {{contact.crmName}}'],
      },
      archivedAt: null,
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: {},
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(sendMessageHandlerMock).toHaveBeenCalledWith(expect.objectContaining({
      contactId: 'contact-sample-1',
      blockSnapshot: expect.objectContaining({
        groupTargets: [{ accountId: 'nick-2', groupId: 'group-2' }],
      }),
    }));
  });

  it('trigger send targets override legacy targets stored on the block', async () => {
    prismaMock.automationTrigger.findFirst.mockResolvedValueOnce({
      id: 'trigger-1',
      eventType: 'manual_run',
      enabled: true,
      bindingKind: 'block',
      blockId: 'block-1',
      eventFilter: null,
      segmentSpec: null,
      ruleOverrides: {
        sendMessageTargets: {
          groupTargets: [{ accountId: 'nick-trigger', groupId: 'group-trigger' }],
        },
      },
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: {},
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(sendMessageHandlerMock).toHaveBeenCalledWith(expect.objectContaining({
      blockSnapshot: expect.objectContaining({
        groupTargets: [{ accountId: 'nick-trigger', groupId: 'group-trigger' }],
      }),
    }));
    expect(sendMessageHandlerMock.mock.calls[0][0].blockSnapshot.groupTarget).toBeUndefined();
  });

  it('uses empty contact context when the org has no sample contact', async () => {
    prismaMock.contact.findFirst.mockResolvedValueOnce(null);

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: {},
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      accepted: true,
      mode: 'direct_block_test',
      sampleContactId: null,
    });
    expect(sendMessageHandlerMock).toHaveBeenCalledWith(expect.objectContaining({
      contactId: '',
    }));
  });

  it('materializes scheduled_cron customer-list triggers immediately when send targets are configured', async () => {
    prismaMock.automationTrigger.findFirst.mockResolvedValueOnce({
      id: 'trigger-1',
      eventType: 'scheduled_cron',
      enabled: true,
      bindingKind: 'block',
      blockId: 'block-1',
      eventFilter: { cron: '0 8 * * 1' },
      segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayThisWeek: true },
      ruleOverrides: {
        sendMessageTargets: {
          groupTargets: [{ accountId: 'nick-1', groupId: 'group-1' }],
        },
      },
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: {},
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      accepted: true,
      triggerId: 'trigger-1',
      eventType: 'scheduled_cron',
      mode: 'materialized',
      materializeResult: {
        campaignsCreated: 1,
        tasksEnqueued: 1,
      },
    });
    expect(sendMessageHandlerMock).not.toHaveBeenCalled();
    expect(eventEmitMock).not.toHaveBeenCalled();
    expect(materializeFromEventMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scheduled_cron',
      orgId: 'org-1',
      payload: { triggerId: 'trigger-1', cron: '0 8 * * 1' },
    }));
  });

  it('runs scheduled_cron customer-list trigger as a direct block test when contactId is provided but no send targets are configured', async () => {
    prismaMock.automationTrigger.findFirst.mockResolvedValueOnce({
      id: 'trigger-1',
      eventType: 'scheduled_cron',
      enabled: true,
      bindingKind: 'block',
      blockId: 'block-1',
      eventFilter: { cron: '0 8 * * 1' },
      segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayThisWeek: true },
      ruleOverrides: null,
    });
    prismaMock.block.findFirst.mockResolvedValueOnce({
      id: 'block-1',
      actionType: 'send_message',
      content: {
        textVariants: ['Xin chao {{contact.crmName}}'],
      },
      archivedAt: null,
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: { contactId: 'contact-manual-1' },
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      accepted: true,
      triggerId: 'trigger-1',
      eventType: 'scheduled_cron',
      mode: 'direct_block_test',
      outcome: 'success',
      sampleContactId: 'contact-manual-1',
    });
    expect(sendMessageHandlerMock).toHaveBeenCalledWith(expect.objectContaining({
      contactId: 'contact-manual-1',
      blockSnapshot: expect.objectContaining({
        textVariants: ['Xin chao {{contact.crmName}}'],
      }),
    }));
    expect(materializeFromEventMock).not.toHaveBeenCalled();
    expect(eventEmitMock).not.toHaveBeenCalled();
  });

  it('returns a conflict when manual scheduled_cron materialization creates no tasks', async () => {
    prismaMock.automationTrigger.findFirst.mockResolvedValueOnce({
      id: 'trigger-1',
      eventType: 'scheduled_cron',
      enabled: true,
      bindingKind: 'block',
      blockId: 'block-1',
      eventFilter: { cron: '0 8 * * 1' },
      segmentSpec: { kind: 'customer-list', listId: 'list-1', birthdayThisWeek: true },
    });
    materializeFromEventMock.mockResolvedValueOnce({
      campaignsCreated: 0,
      tasksEnqueued: 0,
      skipped: 1,
      reasons: ['trigger trigger-1: no contacts resolved (block-bound)'],
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/automation/triggers/trigger-1/run',
      payload: {},
    });
    await app.close();

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({
      accepted: false,
      triggerId: 'trigger-1',
      mode: 'materialized',
      error: 'No automation tasks were created',
      materializeResult: {
        tasksEnqueued: 0,
        reasons: ['trigger trigger-1: no contacts resolved (block-bound)'],
      },
    });
  });
});
