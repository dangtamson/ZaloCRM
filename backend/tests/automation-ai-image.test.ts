// Phase 7 follow-up — AI image generation helper tests.
//
// Covers PURE pieces only (no real HTTP, no real filesystem outside tmpdir):
//   - decodeBase64Image: maxBytes enforcement + data-URI stripping
//   - resolveImageProvider: default fallback + unknown rejection
//   - getStorageRoot: respects env override
//   - generateAndStoreImage: writes file + builds public URL for an injected
//     provider stub
//
// Real provider HTTP paths are exercised via integration tests / manual QA
// (they need network or mocked fetch — out of scope for unit tests).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Set env BEFORE importing the modules that read config at import time.
const tmpRoot = mkdtempSync(path.join(tmpdir(), 'zalo-ai-img-'));
process.env.AI_IMAGE_STORAGE_DIR = tmpRoot;
process.env.AI_IMAGE_PUBLIC_PREFIX = '/ai-test-assets';
process.env.APP_URL = 'http://example.test:3000';
process.env.AI_IMAGE_DEFAULT_PROVIDER = 'openai';

// Import after env is set.
const {
    decodeBase64Image,
    ImageGenError,
} = await import('../src/modules/ai/providers/image/types.js');
const {
    resolveImageProvider,
    getStorageRoot,
    listAvailableImageProviders,
} = await import('../src/modules/ai/image-service.js');

afterAll(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
});

describe('decodeBase64Image', () => {
    it('decodes a plain base64 string', () => {
        const png = Buffer.from('hello-world');
        const b64 = png.toString('base64');
        const out = decodeBase64Image(b64, 1024);
        expect(out.equals(png)).toBe(true);
    });

    it('strips data URI prefix before decoding', () => {
        const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
        const b64 = `data:image/png;base64,${png.toString('base64')}`;
        const out = decodeBase64Image(b64, 1024);
        expect(out.equals(png)).toBe(true);
    });

    it('throws IMAGE_TOO_LARGE when decoded bytes exceed cap', () => {
        const big = Buffer.alloc(2048, 0xaa);
        const b64 = big.toString('base64');
        expect(() => decodeBase64Image(b64, 1024)).toThrowError(/IMAGE_TOO_LARGE|exceeds/);
    });

    it('throws ImageGenError instance (not plain Error)', () => {
        const big = Buffer.alloc(2048);
        try {
            decodeBase64Image(big.toString('base64'), 100);
            throw new Error('should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(ImageGenError);
            expect((err as InstanceType<typeof ImageGenError>).code).toBe('IMAGE_TOO_LARGE');
        }
    });
});

describe('resolveImageProvider', () => {
    it('returns explicit provider when valid', () => {
        expect(resolveImageProvider('gemini')).toBe('gemini');
        expect(resolveImageProvider('custom')).toBe('custom');
        expect(resolveImageProvider('openai')).toBe('openai');
    });

    it('falls back to AI_IMAGE_DEFAULT_PROVIDER when undefined', () => {
        expect(resolveImageProvider(undefined)).toBe('openai');
        expect(resolveImageProvider('')).toBe('openai');
    });

    it('rejects unknown provider id', () => {
        expect(() => resolveImageProvider('midjourney')).toThrowError(/không hỗ trợ/);
    });

    it('lists all 3 registered providers', () => {
        expect(listAvailableImageProviders().sort()).toEqual(['custom', 'gemini', 'openai']);
    });
});

describe('getStorageRoot', () => {
    it('returns the env override when set', () => {
        expect(getStorageRoot()).toBe(path.resolve(tmpRoot));
    });
});

describe('generateAndStoreImage (provider stub)', () => {
    it('writes provider bytes to disk and returns a public URL', async () => {
        // Stub the openai provider via dynamic import + vi.spyOn-style override.
        // The image-service module imports the provider statically, so we use
        // vi.doMock + a fresh import to inject the stub.
        vi.resetModules();
        process.env.AI_IMAGE_STORAGE_DIR = tmpRoot;
        process.env.AI_IMAGE_PUBLIC_PREFIX = '/ai-test-assets';
        process.env.APP_URL = 'http://example.test:3000';
        process.env.AI_IMAGE_DEFAULT_PROVIDER = 'openai';

        const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        vi.doMock('../src/modules/ai/providers/image/openai-image.js', () => ({
            generateImageOpenai: vi.fn(async () => ({ bytes: fakePng, mimeType: 'image/png' })),
        }));

        const mod = await import('../src/modules/ai/image-service.js');
        const out = await mod.generateAndStoreImage({
            orgId: 'org-test-123',
            prompt: 'A cat',
        });

        expect(out.byteLength).toBe(fakePng.length);
        expect(out.mimeType).toBe('image/png');
        expect(out.providerId).toBe('openai');
        expect(out.url.startsWith('http://example.test:3000/ai-test-assets/org-test-123/')).toBe(true);
        expect(out.url.endsWith('.png')).toBe(true);
        expect(existsSync(out.filePath)).toBe(true);
        expect(readFileSync(out.filePath).equals(fakePng)).toBe(true);
    });

    it('rejects orgId with path traversal characters', async () => {
        vi.resetModules();
        const mod = await import('../src/modules/ai/image-service.js');
        await expect(
            mod.generateAndStoreImage({ orgId: '../../etc', prompt: 'x' }),
        ).rejects.toThrowError(/orgId.*không hợp lệ/);
    });

    it('rejects empty prompt', async () => {
        vi.resetModules();
        const mod = await import('../src/modules/ai/image-service.js');
        await expect(
            mod.generateAndStoreImage({ orgId: 'org-x', prompt: '   ' }),
        ).rejects.toThrowError(/prompt rỗng/);
    });
});

// Suppress vi unused-import warning when running in isolation.
beforeAll(() => undefined);
