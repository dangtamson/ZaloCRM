/**
 * OpenAI Images provider — POST {baseUrl}/v1/images/generations.
 *
 * Reuses OPENAI_AUTH_TOKEN + OPENAI_BASE_URL from the text providers so
 * operators don't need a second credential just for image gen.
 *
 * Response shape (OpenAI):
 *   { data: [{ b64_json?: string; url?: string }, ...] }
 * We accept either; b64_json is preferred (no extra hop, no expiring URL).
 */
import { config } from '../../../../config/index.js';
import {
    ImageGenError,
    decodeBase64Image,
    fetchImageBytes,
    type ImageGenInput,
    type ImageGenResult,
} from './types.js';

export async function generateImageOpenai(input: ImageGenInput): Promise<ImageGenResult> {
    const apiKey = config.openaiAuthToken;
    if (!apiKey) {
        throw new ImageGenError(
            'PROVIDER_NOT_CONFIGURED',
            'OPENAI_AUTH_TOKEN chưa được cấu hình — không thể gọi OpenAI Images',
        );
    }

    const model = input.model || config.aiImageOpenaiModel;
    const size = input.size || config.aiImageOpenaiSize;
    const url = `${config.openaiBaseUrl.replace(/\/$/, '')}/v1/images/generations`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.aiImageTimeoutMs);
    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${apiKey}`,
            },
            // n=1: gen exactly one image per call (engine picks variation via
            // per-send template rendering instead, see send-message handler).
            body: JSON.stringify({ model, prompt: input.prompt, n: 1, size }),
            signal: controller.signal,
        });
    } catch (err) {
        const aborted = (err as { name?: string })?.name === 'AbortError';
        throw new ImageGenError(
            aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_HTTP_ERROR',
            `OpenAI Images request failed: ${(err as Error)?.message ?? String(err)}`,
            true,
        );
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        // Don't echo the raw body — may contain prompt text + safety verdict.
        throw new ImageGenError(
            'PROVIDER_HTTP_ERROR',
            `OpenAI Images returned HTTP ${res.status}`,
            res.status >= 500 || res.status === 429,
        );
    }

    const json = (await res.json()) as {
        data?: Array<{ b64_json?: string; url?: string }>;
    };
    const first = json.data?.[0];
    if (!first) {
        throw new ImageGenError('PROVIDER_BAD_RESPONSE', 'OpenAI Images: empty data array');
    }
    if (first.b64_json) {
        return {
            bytes: decodeBase64Image(first.b64_json, config.aiImageMaxBytes),
            // gpt-image-1 returns PNG by default. dall-e-3 also returns PNG.
            mimeType: 'image/png',
        };
    }
    if (first.url) {
        return fetchImageBytes(first.url, config.aiImageMaxBytes, config.aiImageTimeoutMs);
    }
    throw new ImageGenError('PROVIDER_BAD_RESPONSE', 'OpenAI Images: neither b64_json nor url present');
}
