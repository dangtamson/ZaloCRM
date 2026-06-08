import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

let storageRoot = '';

afterEach(async () => {
  vi.resetModules();
  vi.doUnmock('../src/config/index.js');
  if (storageRoot) {
    await rm(storageRoot, { recursive: true, force: true });
    storageRoot = '';
  }
});

describe('renderHtmlTemplateToImage', () => {
  it('renders a variable-filled SVG template to a public PNG asset', async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), 'zalocrm-html-template-'));
    await mkdir(path.join(storageRoot, 'image'), { recursive: true });
    await writeFile(
      path.join(storageRoot, 'image', 'hpbd.png'),
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l9NoWQAAAABJRU5ErkJggg==',
        'base64',
      ),
    );
    vi.doMock('../src/config/index.js', () => ({
      config: {
        appUrl: 'https://crm.example.test',
        aiImagePublicPrefix: '/automation-assets',
        aiImageStorageDir: storageRoot,
      },
    }));

    const { renderHtmlTemplateToImage } = await import('../src/modules/automation/engine/html-image-template.js');

    const result = await renderHtmlTemplateToImage({
      orgId: 'org_1',
      width: 320,
      height: 180,
      htmlTemplate: `
        <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
          <rect width="320" height="180" fill="#fff7e8"/>
          <image href="/automation-assets/image/hpbd.png" x="0" y="0" width="20" height="20"/>
          <text x="24" y="70" font-size="28" fill="#06205a">Chúc mừng {{contact.fullName}}</text>
          <text x="24" y="112" font-size="20" fill="#8a5a10">{{org.name}}</text>
        </svg>
      `,
      context: {
        contact: { fullName: 'Nguyen Van A' },
        org: { name: 'VNPT Cần Thơ' },
      },
    });

    expect(result.url).toMatch(/^https:\/\/crm\.example\.test\/automation-assets\/org_1\/.+\.png$/);
    expect(result.filePath).toMatch(new RegExp(`${storageRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.+\\.png$`));
    const bytes = await readFile(result.filePath);
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
