/**
 * Image generation provider contract.
 *
 * Each provider returns the raw bytes of the generated image so the image
 * service can persist them with a stable filename + mime-correct extension.
 * Returning bytes (instead of a remote URL) means we never depend on the
 * provider's hosting lifecycle — generated images live for as long as we
 * keep them on disk.
 */

export interface ImageGenInput {
    prompt: string;
    /** Optional model override (provider-specific). Defaults from config. */
    model?: string;
    /** Optional size hint like "1024x1024" (provider-specific). */
    size?: string;
}

export interface ImageGenResult {
    bytes: Buffer;
    /** MIME type used to pick the file extension on save. */
    mimeType: string; // 'image/png' | 'image/jpeg' | 'image/webp'
}

export type ImageGenProvider = (input: ImageGenInput) => Promise<ImageGenResult>;

export class ImageGenError extends Error {
    constructor(
        public code:
            | 'PROVIDER_NOT_CONFIGURED'
            | 'PROVIDER_HTTP_ERROR'
            | 'PROVIDER_BAD_RESPONSE'
            | 'PROVIDER_TIMEOUT'
            | 'IMAGE_TOO_LARGE'
            | 'UNKNOWN',
        message: string,
        public retryable = false,
    ) {
        super(message);
        this.name = 'ImageGenError';
    }
}

/**
 * Decode an OpenAI-style { b64_json } payload into bytes.
 * Enforces the global byte cap so a malicious response can't OOM the worker.
 */
export function decodeBase64Image(b64: string, maxBytes: number): Buffer {
    // Strip optional data URI prefix.
    const cleaned = b64.replace(/^data:[^;]+;base64,/, '');
    // Cheap upper bound check before allocating: base64 → bytes ratio is ~3/4.
    if (Math.floor((cleaned.length * 3) / 4) > maxBytes) {
        throw new ImageGenError('IMAGE_TOO_LARGE', `Image exceeds ${maxBytes} bytes (base64)`);
    }
    const buf = Buffer.from(cleaned, 'base64');
    if (buf.length > maxBytes) {
        throw new ImageGenError('IMAGE_TOO_LARGE', `Image exceeds ${maxBytes} bytes (decoded)`);
    }
    return buf;
}

/**
 * Fetch a remote image URL and return its bytes, enforcing maxBytes.
 * Used by providers that return a hosted URL instead of inline base64.
 */
export async function fetchImageBytes(
    url: string,
    maxBytes: number,
    timeoutMs: number,
): Promise<ImageGenResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
            throw new ImageGenError(
                'PROVIDER_HTTP_ERROR',
                `Download failed ${res.status} ${res.statusText}`,
                res.status >= 500,
            );
        }
        const contentLength = parseInt(res.headers.get('content-length') || '0');
        if (contentLength > maxBytes) {
            throw new ImageGenError('IMAGE_TOO_LARGE', `Content-Length ${contentLength} > ${maxBytes}`);
        }
        const ab = await res.arrayBuffer();
        if (ab.byteLength > maxBytes) {
            throw new ImageGenError('IMAGE_TOO_LARGE', `Body ${ab.byteLength} > ${maxBytes}`);
        }
        const mime = res.headers.get('content-type') || 'image/png';
        return { bytes: Buffer.from(ab), mimeType: mime.split(';')[0].trim() };
    } catch (err) {
        if (err instanceof ImageGenError) throw err;
        const aborted = (err as { name?: string })?.name === 'AbortError';
        throw new ImageGenError(
            aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_HTTP_ERROR',
            `Image download failed: ${(err as Error)?.message ?? String(err)}`,
            true,
        );
    } finally {
        clearTimeout(timer);
    }
}
