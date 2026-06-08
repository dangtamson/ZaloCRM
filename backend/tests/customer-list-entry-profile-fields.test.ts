import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

const prismaMock = {
  customerList: { findFirst: vi.fn(), update: vi.fn() },
  customerListEntry: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  zaloAccount: { findMany: vi.fn() },
};

vi.mock('../src/shared/database/prisma-client.js', () => ({ prisma: prismaMock }));
vi.mock('../src/modules/auth/auth-middleware.js', () => ({
  authMiddleware: async (req: any) => {
    req.user = { id: 'user-1', orgId: 'org-1', role: 'admin', email: 't@example.com' };
  },
}));
vi.mock('../src/modules/automation/lists/list-enrichment-service.js', () => ({
  kickoffEnrichment: vi.fn(),
}));
vi.mock('../src/shared/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { customerListEntryRoutes } = await import('../src/modules/automation/lists/list-entry-routes.js');

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(customerListEntryRoutes);
  await app.ready();
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.customerList.findFirst.mockResolvedValue({ id: 'list-1', orgId: 'org-1' });
  prismaMock.zaloAccount.findMany.mockResolvedValue([]);
  prismaMock.customerListEntry.aggregate.mockResolvedValue({ _count: { _all: 1 } });
  prismaMock.customerListEntry.groupBy.mockResolvedValue([]);
  prismaMock.customerListEntry.count.mockResolvedValue(1);
  prismaMock.customerList.update.mockResolvedValue({});
});

describe('customer list entry profile fields', () => {
  it('returns birthDate, gender, occupation, unit, and birthdayWish from GET entries', async () => {
    prismaMock.customerListEntry.findMany.mockResolvedValueOnce([
      {
        id: 'entry-1',
        customerListId: 'list-1',
        rowIndex: 1,
        phoneRaw: '0912345678',
        nameRaw: 'Lan',
        personalNote: null,
        birthDate: new Date('1992-04-03T00:00:00.000Z'),
        gender: 'female',
        occupation: 'Sales',
        unit: 'VNPT Can Tho',
        birthdayWish: 'Chúc chị luôn mạnh khỏe và thành công.',
        resolvedByNickId: null,
        dupWithListId: null,
      },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/customer-lists/list-1/entries',
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(res.json().entries[0]).toMatchObject({
      birthDate: '1992-04-03T00:00:00.000Z',
      gender: 'female',
      occupation: 'Sales',
      unit: 'VNPT Can Tho',
      birthdayWish: 'Chúc chị luôn mạnh khỏe và thành công.',
    });
  });

  it('updates birthDate, gender, occupation, unit, and birthdayWish from PATCH entry', async () => {
    prismaMock.customerListEntry.findFirst.mockResolvedValueOnce({
      id: 'entry-1',
      customerListId: 'list-1',
      phoneRaw: '0912345678',
      phoneValid: true,
      status: 'validated',
    });
    prismaMock.customerListEntry.update.mockResolvedValueOnce({
      id: 'entry-1',
      birthDate: new Date('1992-04-03T00:00:00.000Z'),
      gender: 'male',
      occupation: 'Sales',
      unit: 'Phong Kinh Doanh',
      birthdayWish: 'Chúc anh sinh nhật vui vẻ.',
      phoneValid: true,
      status: 'validated',
    });

    const app = await buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/customer-lists/list-1/entries/entry-1',
      payload: {
        birthDate: '1992-04-03',
        gender: 'Nam',
        occupation: 'Sales',
        unit: 'Phong Kinh Doanh',
        birthdayWish: 'Chúc anh sinh nhật vui vẻ.',
      },
    });
    await app.close();

    expect(res.statusCode).toBe(200);
    expect(prismaMock.customerListEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: {
        birthDate: new Date('1992-04-03T00:00:00.000Z'),
        gender: 'male',
        occupation: 'Sales',
        unit: 'Phong Kinh Doanh',
        birthdayWish: 'Chúc anh sinh nhật vui vẻ.',
      },
    });
    expect(res.json().entry).toMatchObject({
      birthDate: '1992-04-03T00:00:00.000Z',
      gender: 'male',
      occupation: 'Sales',
      unit: 'Phong Kinh Doanh',
      birthdayWish: 'Chúc anh sinh nhật vui vẻ.',
    });
  });
});
