import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { config } from '../../../config/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { renderMessageTemplate, type AutomationTemplateContext } from '../template-renderer.js';

/**
 * Template to image renderer for automation message blocks.
 *
 * The backend does not ship a headless browser, so the supported production
 * format is SVG markup. SVG still lets operators build rich card templates
 * and gives us deterministic PNG output through @resvg/resvg-js.
 */

export interface HtmlImageTemplateInput {
    orgId: string;
    htmlTemplate: string;
    width?: number;
    height?: number;
    context?: {
        contact?: Record<string, unknown> | null;
        org?: Record<string, unknown> | null;
        conversation?: Record<string, unknown> | null;
    };
}

export interface HtmlImageTemplateResult {
    url: string;
    filePath: string;
}

export async function renderHtmlTemplateToImage(
    input: HtmlImageTemplateInput,
): Promise<HtmlImageTemplateResult> {
    logger.debug('[html-image-template] render start', { orgId: input.orgId, width: input.width, height: input.height });
    const width = clampInt(input.width, 320, 3000, 768);
    const height = clampInt(input.height, 320, 4000, 1152);
    const renderedMarkup = normalizeSvgAttributes((await rewriteAutomationAssetHrefs(renderMessageTemplate(
        input.htmlTemplate,
        escapeTemplateContext(input.context),
    )))).trim();

    if (!renderedMarkup) {
        logger.error('[html-image-template] rendered markup empty');
        throw new Error('htmlImageTemplate.html rendered empty');
    }
    if (!/^<svg[\s>]/i.test(renderedMarkup)) {
        logger.error('[html-image-template] not SVG markup', { first80: renderedMarkup.substring(0, 80) });
        throw new Error(
            'htmlImageTemplate hiện hỗ trợ SVG markup để render ảnh. ' +
            'Hãy chọn mẫu SVG có sẵn hoặc dùng template bắt đầu bằng <svg>.',
        );
    }

    logger.debug('[html-image-template] creating Resvg with font config');
    const png = new Resvg(renderedMarkup, {
        fitTo: { mode: 'width', value: width },
        font: {
            loadSystemFonts: true,
            defaultFontFamily: 'DejaVu Sans',
        },
    }).render().asPng();

    const orgSegment = sanitizeOrgSegment(input.orgId);
    const root = getStorageRoot();
    const orgDir = path.join(root, orgSegment);
    await fs.mkdir(orgDir, { recursive: true });

    const fileName = `${randomUUID()}.png`;
    const filePath = path.join(orgDir, fileName);
    logger.info('[html-image-template] writing PNG', { filePath, size: png.length });
    await fs.writeFile(filePath, png);

    const origin = config.appUrl.replace(/\/+$/, '');
    const publicPrefix = config.aiImagePublicPrefix.replace(/\/+$/, '');
    const url = `${origin}${publicPrefix}/${orgSegment}/${fileName}`;
    logger.info('[html-image-template] render complete', { url });
    return {
        filePath,
        url,
    };
}

function normalizeSvgAttributes(markup: string): string {
    // Resvg is stricter than browser parsers. Normalize common operator input
    // where attributes are unquoted (e.g. xmlns=http://..., width=768).
    return markup.replace(/(<[^>]+>)/g, (tag) => (
        tag.replace(/(\s[\w:-]+)=([^\s"'`=<>]+)/g, '$1="$2"')
    ));
}

function getStorageRoot(): string {
    if (config.aiImageStorageDir) return path.resolve(config.aiImageStorageDir);
    const cwdRoot = path.resolve(process.cwd(), 'assets', 'posts', 'automation');
    if (existsSync(cwdRoot)) return cwdRoot;
    const backendCwdRoot = path.resolve(process.cwd(), '..', 'assets', 'posts', 'automation');
    if (existsSync(backendCwdRoot)) return backendCwdRoot;
    return cwdRoot;
}

async function rewriteAutomationAssetHrefs(markup: string): Promise<string> {
    const publicPrefix = config.aiImagePublicPrefix.replace(/\/+$/, '');
    const root = getStorageRoot();
    const escapedPrefix = publicPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(href|xlink:href)=["']${escapedPrefix}/([^"']+)["']`, 'g');
    let result = '';
    let lastIndex = 0;
    for (const match of markup.matchAll(re)) {
        const attr = match[1];
        const assetPath = match[2];
        const decodedPath = decodeURIComponent(assetPath);
        const filePath = path.resolve(root, decodedPath);
        const relative = path.relative(root, filePath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            throw new Error(`automation asset path không hợp lệ: ${assetPath}`);
        }
        const bytes = await fs.readFile(filePath);
        const dataUri = `data:${mimeFromPath(filePath)};base64,${bytes.toString('base64')}`;
        result += markup.slice(lastIndex, match.index);
        result += `${attr}="${dataUri}"`;
        lastIndex = (match.index ?? 0) + match[0].length;
    }
    return result + markup.slice(lastIndex);
}

function mimeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    if (ext === '.svg') return 'image/svg+xml';
    return 'image/png';
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}

function sanitizeOrgSegment(orgId: string): string {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(orgId)) {
        throw new Error(`orgId '${orgId}' không hợp lệ cho template image storage`);
    }
    return orgId;
}

function escapeTemplateContext(
    context: HtmlImageTemplateInput['context'] | undefined,
): AutomationTemplateContext {
    return {
        contact: escapeObject(context?.contact) as AutomationTemplateContext['contact'],
        org: escapeObject(context?.org) as AutomationTemplateContext['org'],
        conversation: escapeObject(context?.conversation) as AutomationTemplateContext['conversation'],
    };
}

function escapeObject(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
    if (!value) return null;
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, escapeValue(item)]),
    );
}

function escapeValue(value: unknown): unknown {
    if (typeof value === 'string') return escapeXml(value);
    if (Array.isArray(value)) return value.map(escapeValue);
    return value;
}

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
