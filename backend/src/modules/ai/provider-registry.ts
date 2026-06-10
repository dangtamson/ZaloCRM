/**
 * Central AI provider registry.
 * Reads env-based config to build list of available providers and their models.
 * Only providers with an AUTH_TOKEN are considered "available".
 */
import { config } from '../../config/index.js';

export type ProviderModel = { title: string; value: string };

export type ProviderDef = {
  id: string;
  name: string;
  baseUrl: string;
  authToken: string;
  authRequired: boolean;
  models: ProviderModel[];
};

/** Helper: include model only if env var is set */
function m(title: string, value: string): ProviderModel | null {
  return value ? { title, value } : null;
}

/** Build full provider definitions from config */
function buildProviders(): ProviderDef[] {
  return [
    {
      id: 'anthropic',
      name: 'Anthropic',
      baseUrl: config.anthropicBaseUrl,
      authToken: config.anthropicAuthToken,
      authRequired: true,
      models: [
        m('Claude Opus', config.anthropicDefaultOpusModel),
        m('Claude Sonnet', config.anthropicDefaultSonnetModel),
        m('Claude Haiku', config.anthropicDefaultHaikuModel),
      ].filter(Boolean) as ProviderModel[],
    },
    {
      id: 'gemini',
      name: 'Gemini',
      baseUrl: config.geminiBaseUrl,
      authToken: config.geminiAuthToken,
      authRequired: true,
      models: [
        m('Gemini Pro', config.geminiDefaultProModel || 'gemini-1.5-pro'),
        m('Gemini Flash', config.geminiDefaultFlashModel || 'gemini-2.5-flash'),
      ].filter(Boolean) as ProviderModel[],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: config.openaiBaseUrl,
      authToken: config.openaiAuthToken,
      authRequired: true,
      models: [
        m('GPT-4o', config.openaiDefaultGpt4oModel || 'gpt-4o'),
        m('GPT-4o Mini', config.openaiDefaultGpt4oMiniModel || 'gpt-4o-mini'),
      ].filter(Boolean) as ProviderModel[],
    },
    {
      id: 'openapi',
      name: 'OpenAPI Compatible',
      baseUrl: config.openapiBaseUrl,
      authToken: config.openapiAuthToken,
      authRequired: true,
      models: [
        m('Custom Model', config.openapiDefaultModel),
      ].filter(Boolean) as ProviderModel[],
    },
    {
      id: 'ollama',
      name: 'Ollama',
      baseUrl: config.ollamaBaseUrl,
      authToken: config.ollamaAuthToken,
      authRequired: false,
      models: [
        m('Llama 3.1', config.ollamaDefaultModel || 'llama3.1'),
      ].filter(Boolean) as ProviderModel[],
    },
    {
      id: 'qwen',
      name: 'Qwen',
      baseUrl: config.qwenBaseUrl,
      authToken: config.qwenAuthToken,
      authRequired: true,
      models: [
        m('Qwen Plus', config.qwenDefaultPlusModel),
        m('Qwen Turbo', config.qwenDefaultTurboModel),
        m('Qwen Max', config.qwenDefaultMaxModel),
      ].filter(Boolean) as ProviderModel[],
    },
    {
      id: 'kimi',
      name: 'Kimi',
      baseUrl: config.kimiBaseUrl,
      authToken: config.kimiAuthToken,
      authRequired: true,
      models: [
        m('Moonshot V1', config.kimiDefaultMoonshotV1Model),
      ].filter(Boolean) as ProviderModel[],
    },
  ];
}

const providers = buildProviders();

/** Returns providers that can be configured in the UI. Runtime validates key/baseUrl. */
export function getAvailableProviders(): Omit<ProviderDef, 'authToken'>[] {
  return providers
    .filter((p) => p.models.length > 0)
    .map(({ authToken: _, ...rest }) => rest);
}

/** Returns full config (including authToken) for a single provider */
export function getProviderConfig(providerId: string): ProviderDef | undefined {
  return providers.find((p) => p.id === providerId);
}
