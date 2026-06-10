import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  aiConfig: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  appSetting: {
    findFirst: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock('../../src/shared/database/prisma-client.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../src/shared/utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AI provider config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.AI_DEFAULT_PROVIDER = 'openapi';
    process.env.AI_DEFAULT_MODEL = 'custom-model';
    process.env.OPENAPI_BASE_URL = 'https://llm.example.test/v1';
    process.env.OPENAPI_DEFAULT_MODEL = 'custom-model';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434/v1';
    process.env.OLLAMA_DEFAULT_MODEL = 'llama3.1';
  });

  it('lists OpenAPI-compatible and Ollama providers for UI selection', async () => {
    const { getAvailableProviders } = await import('../../src/modules/ai/provider-registry.js');

    const providers = getAvailableProviders();

    expect(providers.map((provider) => provider.id)).toEqual(expect.arrayContaining(['openapi', 'ollama', 'gemini', 'openai']));
    expect(providers.find((provider) => provider.id === 'openapi')).toMatchObject({
      name: 'OpenAPI Compatible',
      baseUrl: 'https://llm.example.test/v1',
      models: [{ title: 'Custom Model', value: 'custom-model' }],
    });
    expect(providers.find((provider) => provider.id === 'ollama')).toMatchObject({
      name: 'Ollama',
      baseUrl: 'http://localhost:11434/v1',
      authRequired: false,
      models: [{ title: 'Llama 3.1', value: 'llama3.1' }],
    });
  });

  it('persists selected provider apiKey and baseUrl in app settings', async () => {
    prismaMock.aiConfig.upsert.mockResolvedValue({
      orgId: 'org-1',
      provider: 'openapi',
      model: 'custom-model',
      maxDaily: 100,
      enabled: true,
    });
    prismaMock.aiConfig.findUnique.mockResolvedValue({
      orgId: 'org-1',
      provider: 'openapi',
      model: 'custom-model',
      maxDaily: 100,
      enabled: true,
    });
    prismaMock.appSetting.findFirst.mockImplementation(({ where }: { where: { settingKey: string } }) => {
      if (where.settingKey === 'ai_openapi_api_key') return Promise.resolve({ valuePlain: 'secret-key' });
      if (where.settingKey === 'ai_openapi_base_url') return Promise.resolve({ valuePlain: 'https://llm.example.test/v1' });
      return Promise.resolve(null);
    });

    const { updateAiConfig } = await import('../../src/modules/ai/ai-service.js');
    const result = await updateAiConfig('org-1', {
      provider: 'openapi',
      model: 'custom-model',
      maxDaily: 100,
      enabled: true,
      apiKey: 'secret-key',
      baseUrl: 'https://llm.example.test/v1',
    });

    expect(result).toMatchObject({ provider: 'openapi', model: 'custom-model' });
    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { orgId_settingKey: { orgId: 'org-1', settingKey: 'ai_openapi_api_key' } },
      update: { valuePlain: 'secret-key' },
    }));
    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { orgId_settingKey: { orgId: 'org-1', settingKey: 'ai_openapi_base_url' } },
      update: { valuePlain: 'https://llm.example.test/v1' },
    }));
  });
});
