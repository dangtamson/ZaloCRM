/**
 * Google Imagen provider — POST {baseUrl}/v1beta/models/{model}:predict?key=...
 *
 * Reuses GEMINI_AUTH_TOKEN + GEMINI_BASE_URL. The Imagen API returns base64
 * PNG bytes inline under predictions[].bytesBase64Encoded.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/imagen
 */
import { config } from '../../../../config/index.js';
import {
    ImageGenError,
    decodeBase64Image,
    type ImageGenInput,
    type ImageGenResult,
} from './types.js';

export async function generateImageGemini(input: ImageGenInput): Promise<ImageGenResult> {
    const apiKey = config.geminiAuthToken;
    if (!apiKey) {
        throw new ImageGenError(
            'PROVIDER_NOT_CONFIGURED',
            'GEMINI_AUTH_TOKEN chưa được cấu hình — không thể gọi Gemini Imagen',
        );
    }

    const model = input.model || config.aiImageGeminiModel;
    // Imagen :predict endpoint is on v1beta. Pass key as query string per
    // Google's standard auth pattern for generative API.
    const url = `${config.geminiBaseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(
        model,
    )}:predict?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.aiImageTimeoutMs);
    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: input.prompt }],
                parameters: { sampleCount: 1 },
            }),
            signal: controller.signal,
        });
    } catch (err) {
        const aborted = (err as { name?: string })?.name === 'AbortError';
        throw new ImageGenError(
            aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_HTTP_ERROR',
            `Gemini Imagen request failed: ${(err as Error)?.message ?? String(err)}`,
            true,
        );
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        throw new ImageGenError(
            'PROVIDER_HTTP_ERROR',
            `Gemini Imagen returned HTTP ${res.status}`,
            res.status >= 500 || res.status === 429,
        );
    }

    const json = (await res.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };
    const first = json.predictions?.[0];
    if (!first?.bytesBase64Encoded) {
        throw new ImageGenError(
            'PROVIDER_BAD_RESPONSE',
            'Gemini Imagen: missing predictions[0].bytesBase64Encoded',
        );
    }
    return {
        bytes: decodeBase64Image(first.bytesBase64Encoded, config.aiImageMaxBytes),
        mimeType: first.mimeType || 'image/png',
    };
}
