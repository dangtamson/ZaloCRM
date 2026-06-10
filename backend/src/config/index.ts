/**
 * Centralized configuration loader.
 * All environment variables are read once at startup and typed here.
 */

// SECURITY FIX (A2): JWT_SECRET and ENCRYPTION_KEY must NOT fall back to dev
// defaults when NODE_ENV=production. Webhook signature forgery / token forgery
// possible if dev defaults leak to a prod container with missing env vars.
const isProd = process.env.NODE_ENV === 'production';

const DEV_JWT_FALLBACK = 'dev-secret-change-me';
const DEV_ENC_FALLBACK = 'dev-key-change-me-16b';

export function envValue(name: string): string | undefined {
  const value = process.env[name];
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return '';
  const quote = trimmed[0];
  if (quote === '"' || quote === "'") return trimmed;
  const commentAt = trimmed.search(/\s+#/);
  return (commentAt >= 0 ? trimmed.slice(0, commentAt) : trimmed).trim();
}

function requireSecret(name: string, devFallback: string, value: string | undefined): string {
  if (isProd) {
    if (!value || value === devFallback || value.length < 32) {
      // Fail-fast: better to crash boot than run prod with forgeable secrets.
      throw new Error(
        `[config] FATAL: ${name} must be set (≥32 chars, not the dev default) when NODE_ENV=production. ` +
        `Set ${name} in environment before starting the server.`,
      );
    }
    return value;
  }
  return value || devFallback;
}

export const config = {
  port: parseInt(envValue('PORT') || '3000'),
  host: envValue('HOST') || '0.0.0.0',
  nodeEnv: envValue('NODE_ENV') || 'development',
  jwtSecret: requireSecret('JWT_SECRET', DEV_JWT_FALLBACK, envValue('JWT_SECRET')),
  encryptionKey: requireSecret('ENCRYPTION_KEY', DEV_ENC_FALLBACK, envValue('ENCRYPTION_KEY')),
  databaseUrl: envValue('DATABASE_URL') || 'postgresql://crmuser:password@localhost:5432/zalocrm',
  uploadDir: envValue('UPLOAD_DIR') || '/var/lib/zalo-crm/files',
  appUrl: envValue('APP_URL') || 'http://localhost:3000',

  /* --- S3/MinIO storage for chat attachments --- */
  s3Endpoint: envValue('S3_ENDPOINT') || 'http://localhost:9000',
  s3PublicUrl: envValue('S3_PUBLIC_URL') || 'http://localhost:9000',
  s3Bucket: envValue('S3_BUCKET') || 'zalocrm-attachments',
  s3AccessKey: envValue('S3_ACCESS_KEY') || 'minioadmin',
  s3SecretKey: envValue('S3_SECRET_KEY') || 'minioadmin',
  s3Region: envValue('S3_REGION') || 'us-east-1',

  aiDefaultProvider: envValue('AI_DEFAULT_PROVIDER') || 'anthropic',
  aiDefaultModel: envValue('AI_DEFAULT_MODEL') || 'claude-sonnet-4-6',

  /* Legacy keys (kept for backward compat) */
  anthropicApiKey: envValue('ANTHROPIC_API_KEY') || envValue('ANTHROPIC_AUTH_TOKEN') || '',
  geminiApiKey: envValue('GEMINI_API_KEY') || envValue('GEMINI_AUTH_TOKEN') || '',

  /* --- AI Provider configs --- */
  anthropicBaseUrl: envValue('ANTHROPIC_BASE_URL') || 'https://api.anthropic.com',
  anthropicAuthToken: envValue('ANTHROPIC_AUTH_TOKEN') || envValue('ANTHROPIC_API_KEY') || '',
  anthropicDefaultOpusModel: envValue('ANTHROPIC_DEFAULT_OPUS_MODEL') || '',
  anthropicDefaultSonnetModel: envValue('ANTHROPIC_DEFAULT_SONNET_MODEL') || '',
  anthropicDefaultHaikuModel: envValue('ANTHROPIC_DEFAULT_HAIKU_MODEL') || '',

  geminiBaseUrl: envValue('GEMINI_BASE_URL') || 'https://generativelanguage.googleapis.com',
  geminiAuthToken: envValue('GEMINI_AUTH_TOKEN') || envValue('GEMINI_API_KEY') || '',
  geminiDefaultProModel: envValue('GEMINI_DEFAULT_PRO_MODEL') || '',
  geminiDefaultFlashModel: envValue('GEMINI_DEFAULT_FLASH_MODEL') || '',

  openaiBaseUrl: envValue('OPENAI_BASE_URL') || 'https://api.openai.com',
  openaiAuthToken: envValue('OPENAI_AUTH_TOKEN') || '',
  openaiDefaultGpt4oModel: envValue('OPENAI_DEFAULT_GPT4O_MODEL') || '',
  openaiDefaultGpt4oMiniModel: envValue('OPENAI_DEFAULT_GPT4O_MINI_MODEL') || '',

  openapiBaseUrl: envValue('OPENAPI_BASE_URL') || '',
  openapiAuthToken: envValue('OPENAPI_AUTH_TOKEN') || envValue('OPENAPI_API_KEY') || '',
  openapiDefaultModel: envValue('OPENAPI_DEFAULT_MODEL') || '',

  ollamaBaseUrl: envValue('OLLAMA_BASE_URL') || 'http://localhost:11434/v1',
  ollamaAuthToken: envValue('OLLAMA_AUTH_TOKEN') || '',
  ollamaDefaultModel: envValue('OLLAMA_DEFAULT_MODEL') || 'llama3.1',

  qwenBaseUrl: envValue('QWEN_BASE_URL') || 'https://dashscope.aliyuncs.com',
  qwenAuthToken: envValue('QWEN_AUTH_TOKEN') || '',
  qwenDefaultPlusModel: envValue('QWEN_DEFAULT_PLUS_MODEL') || '',
  qwenDefaultTurboModel: envValue('QWEN_DEFAULT_TURBO_MODEL') || '',
  qwenDefaultMaxModel: envValue('QWEN_DEFAULT_MAX_MODEL') || '',

  kimiBaseUrl: envValue('KIMI_BASE_URL') || 'https://api.moonshot.cn',
  kimiAuthToken: envValue('KIMI_AUTH_TOKEN') || '',
  kimiDefaultMoonshotV1Model: envValue('KIMI_DEFAULT_MOONSHOT_V1_MODEL') || '',

  /* --- AI Image Generation (automation send_message AI image attachment) ---
   * Provider is chosen per-block (content.aiImagePrompt.provider) and falls
   * back to AI_IMAGE_DEFAULT_PROVIDER. Each provider reuses its existing
   * AUTH_TOKEN (OPENAI_AUTH_TOKEN / GEMINI_AUTH_TOKEN) or a dedicated custom
   * endpoint via AI_IMAGE_CUSTOM_URL + AI_IMAGE_CUSTOM_AUTH_TOKEN.
   *
   * Generated images are downloaded to AI_IMAGE_STORAGE_DIR and served via
   * the /automation-assets static route (registered in app.ts). The public
   * URL uses APP_URL as the origin. */
  aiImageDefaultProvider: envValue('AI_IMAGE_DEFAULT_PROVIDER') || 'openai',
  aiImageOpenaiModel: envValue('AI_IMAGE_OPENAI_MODEL') || 'gpt-image-1',
  aiImageOpenaiSize: envValue('AI_IMAGE_OPENAI_SIZE') || '1024x1024',
  aiImageGeminiModel: envValue('AI_IMAGE_GEMINI_MODEL') || 'imagen-3.0-generate-002',
  aiImageCustomUrl: envValue('AI_IMAGE_CUSTOM_URL') || '',
  aiImageCustomAuthToken: envValue('AI_IMAGE_CUSTOM_AUTH_TOKEN') || '',
  /* Default: <workspace>/assets/posts/automation. Backend cwd at runtime is
   * the `backend/` folder (npm run dev), so we resolve one level up. */
  aiImageStorageDir: envValue('AI_IMAGE_STORAGE_DIR') || '',
  aiImagePublicPrefix: envValue('AI_IMAGE_PUBLIC_PREFIX') || '/automation-assets',
  /* Hard cap on bytes downloaded per generation (defensive against rogue
   * provider responses). Default 12 MB ≈ generous for 4k PNG. */
  aiImageMaxBytes: parseInt(envValue('AI_IMAGE_MAX_BYTES') || '12582912'),
  /* HTTP request timeout per generation call (ms). */
  aiImageTimeoutMs: parseInt(envValue('AI_IMAGE_TIMEOUT_MS') || '60000'),

  isProduction: process.env.NODE_ENV === 'production',
};
