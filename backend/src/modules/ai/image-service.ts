/**
 * Image generation orchestrator for automation send_message blocks.
 *
 * Resolves the configured provider, runs the gen, writes the bytes to the
 * per-org storage directory, and returns a public URL ready for the Zalo
 * SDK `sendImage` call.
 *
 * Design notes (decisions confirmed with operator):
 *   - Storage = `assets/posts/automation/<orgId>/<uuid>.<ext>` on local disk.
 *     The fastifyStatic registration in app.ts serves this under
 *     `${APP_URL}${AI_IMAGE_PUBLIC_PREFIX}/<orgId>/<uuid>.<ext>`.
 *   - Generation is per-send (image differs per recipient), called by the
 *     send-message action handler.
 *   - We never trust provider-supplied filenames — every saved file uses a
 *     fresh UUID + extension derived from mimeType.
 *   - orgId is sanitized against path traversal even though it's a UUID:
 *     defense-in-depth in case the schema later allows other shapes.
 */
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { config } from '../../config/index.js';
import { logger } from '../../shared/utils/logger.js';
import {
    ImageGenError,
    type ImageGenInput,
    type ImageGenResult,
    type ImageGenProvider,
} from './providers/image/types.js';
import { generateImageOpenai } from './providers/image/openai-image.js';
import { generateImageGemini } from './providers/image/gemini-image.js';
import { generateImageCustom } from './providers/image/custom-image.js';

export type ImageProviderId = 'openai' | 'gemini' | 'custom';

const PROVIDERS: Record<ImageProviderId, ImageGenProvider> = {
    openai: generateImageOpenai,
    gemini: generateImageGemini,
    custom: generateImageCustom,
};

export function listAvailableImageProviders(): ImageProviderId[] {
    return Object.keys(PROVIDERS) as ImageProviderId[];
}

export function resolveImageProvider(provider?: string): ImageProviderId {
    const candidate = (provider || config.aiImageDefaultProvider) as ImageProviderId;
    if (!(candidate in PROVIDERS)) {
        throw new ImageGenError(
            'PROVIDER_NOT_CONFIGURED',
            `Provider '${candidate}' không hỗ trợ. Hợp lệ: ${listAvailableImageProviders().join(', ')}`,
        );
    }
    return candidate;
}

/**
 * Compute the on-disk root for stored images. Defaults to
 * `<workspaceRoot>/assets/posts/automation` where workspaceRoot is one level
 * up from the backend cwd (matches `cd backend && npm run dev`).
 *
 * Exported for test inspection.
 */
export function getStorageRoot(): string {
    if (config.aiImageStorageDir) return path.resolve(config.aiImageStorageDir);
    const cwdRoot = path.resolve(process.cwd(), 'assets', 'posts', 'automation');
    if (existsSync(cwdRoot)) return cwdRoot;
    const backendCwdRoot = path.resolve(process.cwd(), '..', 'assets', 'posts', 'automation');
    if (existsSync(backendCwdRoot)) return backendCwdRoot;
    return cwdRoot;
}

function extensionFromMime(mime: string): string {
    const m = mime.toLowerCase();
    if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
    if (m.includes('webp')) return '.webp';
    if (m.includes('gif')) return '.gif';
    // default png — safest for AI-gen
    return '.png';
}

/** Reject anything that could escape the per-org directory. */
function sanitizeOrgSegment(orgId: string): string {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(orgId)) {
        throw new ImageGenError(
            'UNKNOWN',
            `orgId '${orgId}' không hợp lệ cho path storage (chỉ chấp nhận A-Z, 0-9, _, -, ≤64 ký tự)`,
        );
    }
    return orgId;
}

export interface GeneratedImage {
    /** Absolute filesystem path written. */
    filePath: string;
    /** Public URL (built from APP_URL + AI_IMAGE_PUBLIC_PREFIX). */
    url: string;
    mimeType: string;
    byteLength: number;
    providerId: ImageProviderId;
}

export interface GenerateImageOptions {
    orgId: string;
    prompt: string;
    provider?: string;
    model?: string;
    size?: string;
}

/**
 * Generate + persist an image. Throws ImageGenError on failure so the caller
 * (engine action handler) can classify retryability.
 */
export async function generateAndStoreImage(
    options: GenerateImageOptions,
): Promise<GeneratedImage> {
    const prompt = options.prompt?.trim();
    if (!prompt) {
        throw new ImageGenError('UNKNOWN', 'prompt rỗng — không thể gọi image gen');
    }

    const providerId = resolveImageProvider(options.provider);
    const providerFn = PROVIDERS[providerId];

    const input: ImageGenInput = {
        prompt,
        model: options.model,
        size: options.size,
    };

    let result: ImageGenResult;
    try {
        result = await providerFn(input);
    } catch (err) {
        if (err instanceof ImageGenError) throw err;
        throw new ImageGenError(
            'UNKNOWN',
            `Image provider '${providerId}' threw: ${(err as Error)?.message ?? String(err)}`,
            true,
        );
    }

    const orgSegment = sanitizeOrgSegment(options.orgId);
    const root = getStorageRoot();
    const orgDir = path.join(root, orgSegment);
    await fs.mkdir(orgDir, { recursive: true });

    const filename = `${randomUUID()}${extensionFromMime(result.mimeType)}`;
    const filePath = path.join(orgDir, filename);
    await fs.writeFile(filePath, result.bytes);

    const publicPrefix = config.aiImagePublicPrefix.replace(/\/+$/, '');
    const origin = config.appUrl.replace(/\/+$/, '');
    const url = `${origin}${publicPrefix}/${orgSegment}/${filename}`;

    logger.info(
        `[ai-image] generated provider=${providerId} bytes=${result.bytes.length} → ${url}`,
    );

    return {
        filePath,
        url,
        mimeType: result.mimeType,
        byteLength: result.bytes.length,
        providerId,
    };
}
