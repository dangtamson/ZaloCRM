/**
 * Custom image gen provider — POST JSON { prompt, model?, size? } to
 * AI_IMAGE_CUSTOM_URL with optional Bearer auth.
 *
 * Accepts three response shapes (auto-detected):
 *   1. application/json { url: string }         → URL fetched separately
 *   2. application/json { b64_json: string }    → decoded inline
 *   3. image/png|jpeg|webp binary body          → used as-is
 *
 * Lets operators wire any self-hosted endpoint (ComfyUI proxy, Replicate
 * forward, Stable Diffusion WebUI) without code changes.
 */
import { config } from '../../../../config/index.js';
import {
    ImageGenError,
    decodeBase64Image,
    fetchImageBytes,
    type ImageGenInput,
    type ImageGenResult,
} from './types.js';

export async function generateImageCustom(input: ImageGenInput): Promise<ImageGenResult> {
    const url = config.aiImageCustomUrl;
    if (!url) {
        throw new ImageGenError(
            'PROVIDER_NOT_CONFIGURED',
            'AI_IMAGE_CUSTOM_URL chưa cấu hình — không thể gọi custom image provider',
        );
    }

    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (config.aiImageCustomAuthToken) {
        headers.authorization = `Bearer ${config.aiImageCustomAuthToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.aiImageTimeoutMs);
    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                prompt: input.prompt,
                ...(input.model ? { model: input.model } : {}),
                ...(input.size ? { size: input.size } : {}),
            }),
            signal: controller.signal,
        });
    } catch (err) {
        const aborted = (err as { name?: string })?.name === 'AbortError';
        throw new ImageGenError(
            aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_HTTP_ERROR',
            `Custom image request failed: ${(err as Error)?.message ?? String(err)}`,
            true,
        );
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        throw new ImageGenError(
            'PROVIDER_HTTP_ERROR',
            `Custom image endpoint returned HTTP ${res.status}`,
            res.status >= 500 || res.status === 429,
        );
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.startsWith('image/')) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > config.aiImageMaxBytes) {
            throw new ImageGenError('IMAGE_TOO_LARGE', `Image ${ab.byteLength} > ${config.aiImageMaxBytes}`);
        }
        return { bytes: Buffer.from(ab), mimeType: contentType.split(';')[0].trim() };
    }

    // JSON path
    const json = (await res.json()) as { url?: string; b64_json?: string; image?: string };
    if (json.b64_json) {
        return {
            bytes: decodeBase64Image(json.b64_json, config.aiImageMaxBytes),
            mimeType: 'image/png',
        };
    }
    // Some endpoints use `image` for base64.
    if (json.image && json.image.length > 200 && !json.image.startsWith('http')) {
        return {
            bytes: decodeBase64Image(json.image, config.aiImageMaxBytes),
            mimeType: 'image/png',
        };
    }
    if (json.url) {
        return fetchImageBytes(json.url, config.aiImageMaxBytes, config.aiImageTimeoutMs);
    }
    throw new ImageGenError(
        'PROVIDER_BAD_RESPONSE',
        'Custom endpoint response chưa hợp lệ — cần { url } | { b64_json } | binary image/*',
    );
}
