// Phase G full — send_message action handler (REAL Zalo SDK).
//
// Flow:
//   1. Read blockSnapshot.textVariants — pick one randomly
//   2. Find Friend row for (assignedNickId, contactId)
//      - must be friendshipStatus='accepted' (or 'pending_sent' if user replied first)
//      - extract zaloUidInNick → threadId
//   3. Get or create Conversation with (zaloAccountId, externalThreadId)
//   4. zaloOps.sendMessage(nickId, threadId, threadType=0, { msg: text })
//   5. Persist Message row with senderType='self', zaloMsgId from response
//   6. Apply Contact + Friend aggregates so /contacts dashboard updates
//
// Worker handles ZaloAccount.lastMessageSentAt update on success.
// Attachments support deferred — text-only for now (logs a warning if present).
//
// Set AUTOMATION_STUB_MODE=true to revert to stub for safe testing.

import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prisma } from '../../../../shared/database/prisma-client.js';
import { logger } from '../../../../shared/utils/logger.js';
import { zaloOps } from '../../../../shared/zalo-operations.js';
import { applyContactAggregateFromMessage, applyFriendAggregate } from '../../../contacts/contact-aggregate.js';
import { renderMessageTemplate } from '../../template-renderer.js';
import { generateAndStoreImage } from '../../../ai/image-service.js';
import { ImageGenError } from '../../../ai/providers/image/types.js';
import type { AiImagePrompt } from '../../blocks/types.js';
import type { ActionContext, ActionResult } from '../types.js';
import { renderHtmlTemplateToImage } from '../html-image-template.js';
import { normalizeSendMessageTargets, type SendMessageTarget } from '../send-message-targets.js';
import { resolveZaloAccountId } from '../zalo-account-resolution.js';
import { SEND_MESSAGE_TARGET_DELAY_MS, sleep } from '../send-message-delay.js';

const STUB_MODE = process.env.AUTOMATION_STUB_MODE === 'true';

async function executeBatchTargets(
  ctx: ActionContext,
  snap: {
    textVariants?: string[];
    attachments?: Array<{ kind: string; url: string; caption?: string; thumbnailUrl?: string; altText?: string; filePath?: string }>;
    aiImagePrompt?: AiImagePrompt;
    groupTarget?: { accountId?: string; groupId?: string };
    groupTargets?: Array<{ accountId?: string; groupId?: string }>;
    userTargets?: Array<{ accountId?: string; contactId?: string }>;
    htmlImageTemplate?: { html?: string; width?: number; height?: number; failOpen?: boolean };
    __templateContactOverride?: Record<string, unknown>;
    __templateContactOverrides?: Array<Record<string, unknown>>;
  },
  targets: SendMessageTarget[],
): Promise<ActionResult> {
  const fallbackContactId = ctx.contactId || (await findSampleContactId(ctx.orgId)) || '';
  const results: Array<{ target: SendMessageTarget; result: ActionResult }> = [];
  let successCount = 0;
  let firstFailure: ActionResult | null = null;
  let sawRetryableFailure = false;

  for (let i = 0; i < targets.length; i += 1) {
    if (i > 0) {
      await sleep(SEND_MESSAGE_TARGET_DELAY_MS);
    }

    const target = targets[i];
    const resolvedAccountId = await resolveZaloAccountId(ctx.orgId, target.accountId);
    if (!resolvedAccountId) {
      const failure: ActionResult = {
        outcome: 'failure',
        errorCode: 'TARGET_ACCOUNT_NOT_FOUND',
        errorMessage: `Target account '${target.accountId}' not found`,
        retryable: false,
      };
      results.push({ target, result: failure });
      if (!firstFailure) firstFailure = failure;
      continue;
    }

    const batchSnap: Record<string, unknown> = {
      ...snap,
      groupTargets: undefined,
      userTargets: undefined,
      __batchNoLegacy: true,
    };
    const batchCtx: ActionContext = {
      ...ctx,
      assignedNickId: resolvedAccountId,
      contactId: ctx.contactId || fallbackContactId,
      blockSnapshot: target.kind === 'group'
        ? { ...batchSnap, groupTarget: { accountId: resolvedAccountId, groupId: target.groupId } }
        : { ...batchSnap, __recipientContactId: target.contactId },
    };

    const result = await sendMessageHandler(batchCtx);
    results.push({ target, result });
    if (result.outcome === 'success') {
      successCount += 1;
      await prisma.zaloAccount.update({
        where: { id: resolvedAccountId },
        data: { lastMessageSentAt: new Date() },
      });
      continue;
    }
    if (result.retryable) sawRetryableFailure = true;
    if (!firstFailure) firstFailure = result;
  }

  if (successCount > 0) {
    return {
      outcome: 'success',
      data: {
        batch: true,
        totalTargets: targets.length,
        sentCount: successCount,
        failedCount: targets.length - successCount,
        results,
      },
    };
  }

  return {
    outcome: 'failure',
    errorCode: firstFailure?.errorCode ?? 'BATCH_SEND_FAILED',
    errorMessage: firstFailure?.errorMessage ?? 'All batch sends failed',
    retryable: sawRetryableFailure,
    data: { batch: true, totalTargets: targets.length, results },
  };
}

async function findSampleContactId(orgId: string): Promise<string | null> {
  const sampleContact = await prisma.contact.findFirst({
    where: { orgId, mergedInto: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return sampleContact?.id ?? null;
}

async function downloadAttachmentUrlToTemp(url: string, kind: string): Promise<{ filePath: string }> {
  if (!/^https?:\/\//i.test(url)) {
    return { filePath: url };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`Không tải được attachment '${url}': HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Không tải được attachment '${url}': empty response`);
  }
  const dir = await mkdtemp(path.join(tmpdir(), 'zalocrm-automation-attachment-'));
  const filePath = path.join(dir, filenameFromUrl(url, kind));
  await writeFile(filePath, buffer);
  return { filePath };
}

function filenameFromUrl(url: string, kind: string): string {
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname);
    if (basename && basename.includes('.')) return basename;
  } catch {
    // Fall through to kind-based default.
  }
  if (kind === 'image') return 'attachment.jpg';
  if (kind === 'video') return 'attachment.mp4';
  return 'attachment.bin';
}

function buildTemplateContact(
  contact: {
    id: string;
    fullName: string | null;
    crmName: string | null;
    phone: string | null;
    status: string | null;
    tags: unknown;
    birthDate: Date | null;
    gender: string | null;
    occupation: string | null;
    unit?: string | null;
    birthdayWish?: string | null;
  } | null,
  override: Record<string, unknown> | undefined,
) {
  const base = contact
    ? {
      id: contact.id,
      fullName: contact.fullName,
      crmName: contact.crmName,
      phone: contact.phone,
      status: contact.status,
      tags: contact.tags,
      birthDate: contact.birthDate,
      gender: contact.gender,
      occupation: contact.occupation,
      unit: contact.unit ?? null,
      birthdayWish: contact.birthdayWish ?? null,
    }
    : null;
  if (!override || typeof override !== 'object') return base;
  const apply = (value: unknown) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && !value.trim()) return undefined;
    return value;
  };
  return {
    id: typeof override.id === 'string' && override.id ? override.id : (base?.id ?? ''),
    fullName: (apply(override.fullName) as string | null | undefined) ?? base?.fullName ?? '',
    crmName: (apply(override.crmName) as string | null | undefined) ?? base?.crmName ?? base?.fullName ?? '',
    phone: (apply(override.phone) as string | null | undefined) ?? base?.phone ?? '',
    status: (apply(override.status) as string | null | undefined) ?? base?.status ?? '',
    tags: override.tags ?? base?.tags ?? [],
    birthDate: (apply(override.birthDate) as Date | string | null | undefined) ?? base?.birthDate ?? null,
    gender: (apply(override.gender) as string | null | undefined) ?? base?.gender ?? '',
    occupation: (apply(override.occupation) as string | null | undefined) ?? base?.occupation ?? '',
    unit: (apply(override.unit) as string | null | undefined) ?? base?.unit ?? '',
    birthdayWish: (apply(override.birthdayWish) as string | null | undefined) ?? base?.birthdayWish ?? '',
  };
}

export async function sendMessageHandler(ctx: ActionContext): Promise<ActionResult> {
  const snap = ctx.blockSnapshot as {
    textVariants?: string[];
    attachments?: Array<{ kind: string; url: string; caption?: string; thumbnailUrl?: string; altText?: string; filePath?: string }>;
    aiImagePrompt?: AiImagePrompt;
    groupTarget?: { accountId?: string; groupId?: string };
    htmlImageTemplate?: { html?: string; width?: number; height?: number; failOpen?: boolean };
    __recipientContactId?: string;
    __templateContactOverride?: Record<string, unknown>;
    __templateContactOverrides?: Array<Record<string, unknown>>;
  };

  if (!Array.isArray(snap.textVariants) || snap.textVariants.length === 0) {
    return {
      outcome: 'failure',
      errorCode: 'BAD_SNAPSHOT',
      errorMessage: 'blockSnapshot.textVariants empty',
      retryable: false,
    };
  }
  const explicitTargets = normalizeSendMessageTargets(snap);
  if (explicitTargets.length > 0) {
    return executeBatchTargets(ctx, snap, explicitTargets);
  }
  if (!ctx.assignedNickId) {
    return {
      outcome: 'failure',
      errorCode: 'NO_NICK',
      errorMessage: 'assignedNickId required for send_message',
      retryable: false,
    };
  }

  // Load context once for all template rendering paths (text, AI prompt, HTML image).
  const contact = await prisma.contact.findFirst({
    where: { id: ctx.contactId, orgId: ctx.orgId },
    select: {
      id: true,
      fullName: true,
      crmName: true,
      phone: true,
      status: true,
      tags: true,
      birthDate: true,
      gender: true,
      occupation: true,
    },
  });
  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    select: { id: true, name: true },
  });
  const templateContactOverrides = Array.isArray(snap.__templateContactOverrides)
    ? snap.__templateContactOverrides.filter((item): item is Record<string, unknown> => (
      Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    ))
    : [];
  const templateContact = buildTemplateContact(
    contact,
    snap.__templateContactOverride ?? templateContactOverrides[0],
  );

  const textTpl = snap.textVariants[Math.floor(Math.random() * snap.textVariants.length)];
  const text = renderMessageTemplate(textTpl, {
    contact: templateContact,
    org: org ?? null,
    conversation: null,
  });
  // Clone the static attachment list — we may prepend an AI-generated image
  // below without mutating the frozen snapshot.
  const attachments: Array<{ kind: string; url: string; caption?: string; thumbnailUrl?: string; altText?: string; filePath?: string }> =
    Array.isArray(snap.attachments) ? [...snap.attachments] : [];

  if (STUB_MODE) {
    logger.info(`[send-message STUB] would send "${text.slice(0, 40)}..." + ${attachments.length} attachment(s) from nick ${ctx.assignedNickId} to contact ${ctx.contactId}`);
    return {
      outcome: 'success',
      data: { stub: true, textUsed: text, attachmentCount: attachments.length },
    };
  }

  // ── HTML template image rendering (optional) ─────────────────────────────
  if (snap.htmlImageTemplate?.html) {
    const failOpen = snap.htmlImageTemplate.failOpen !== false;
    try {
      const contactsForImageRender = templateContactOverrides.length > 0
        ? templateContactOverrides.map((override) => buildTemplateContact(contact, override))
        : [templateContact];
      const renderedImages: Array<{ kind: string; url: string; filePath?: string; caption: string }> = [];
      for (const contactForImage of contactsForImageRender) {
        const rendered = await renderHtmlTemplateToImage({
          orgId: ctx.orgId,
          htmlTemplate: snap.htmlImageTemplate.html,
          width: snap.htmlImageTemplate.width,
          height: snap.htmlImageTemplate.height,
          context: {
            contact: contactForImage,
            org: org ?? null,
            conversation: null,
          },
        });
        renderedImages.push({ kind: 'image', url: rendered.url, filePath: rendered.filePath, caption: text });
      }
      attachments.unshift(...renderedImages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!failOpen) {
        return {
          outcome: 'failure',
          errorCode: 'HTML_IMAGE_RENDER_FAILED',
          errorMessage: msg,
          retryable: false,
        };
      }
      logger.warn(`[send-message] html image render failed (failOpen=true): ${msg}`);
    }
  }

  // ── AI image generation (optional) ───────────────────────────────────────
  // If the block has aiImagePrompt, we render template variables against the
  // contact and produce a fresh image per send. The image is prepended to
  // attachments so the dispatcher below treats it as the primary attachment.
  // failOpen (default true) lets the text still go out if image gen fails —
  // operator can flip to false to abort the step instead.
  if (snap.aiImagePrompt && snap.aiImagePrompt.prompt) {
    const aiCfg = snap.aiImagePrompt;
    const failOpen = aiCfg.failOpen !== false;
    try {
      const renderedPrompt = renderMessageTemplate(aiCfg.prompt, {
        contact: templateContact,
        org: org ?? null,
        conversation: null,
      }).trim();

      if (!renderedPrompt) {
        throw new ImageGenError('UNKNOWN', 'Rendered AI image prompt is empty');
      }

      const generated = await generateAndStoreImage({
        orgId: ctx.orgId,
        prompt: renderedPrompt,
        provider: aiCfg.provider,
        model: aiCfg.model,
        size: aiCfg.size,
      });
      // Prepend so dispatch picks our generated image first.
      attachments.unshift({
        kind: 'image',
        url: generated.url,
        filePath: generated.filePath,
        caption: text,
      });
      logger.info(
        `[send-message] AI image prepended for contact=${ctx.contactId} provider=${generated.providerId} bytes=${generated.byteLength}`,
      );
    } catch (err) {
      const code = err instanceof ImageGenError ? err.code : 'UNKNOWN';
      const msg = err instanceof Error ? err.message : String(err);
      const retryable = err instanceof ImageGenError ? err.retryable : false;
      if (!failOpen) {
        return {
          outcome: 'failure',
          errorCode: `AI_IMAGE_${code}`,
          errorMessage: `AI image gen failed: ${msg}`,
          retryable,
        };
      }
      logger.warn(
        `[send-message] AI image gen failed (failOpen=true, sending text only): ${code} ${msg}`,
      );
    }
  }

  // ── Real impl ───────────────────────────────────────────────────────────

  let threadId = '';
  let threadType: 0 | 1 = 0;
  const isGroupTarget = Boolean(snap.groupTarget?.groupId);
  let recipientContactId = ctx.contactId;

  if (isGroupTarget) {
    threadId = String(snap.groupTarget!.groupId);
    threadType = 1;
  } else {
    recipientContactId = typeof snap.__recipientContactId === 'string' && snap.__recipientContactId.trim()
      ? snap.__recipientContactId.trim()
      : ctx.contactId;
    // Step 1: find Friend row to get threadId (= zaloUidInNick) and verify status
    const friend = await prisma.friend.findFirst({
      where: {
        zaloAccountId: ctx.assignedNickId,
        contactId: recipientContactId,
        orgId: ctx.orgId,
      },
      select: {
        id: true,
        zaloUidInNick: true,
        friendshipStatus: true,
        hasConversation: true,
      },
    });
    if (!friend) {
      return {
        outcome: 'failure',
        errorCode: 'NO_FRIEND_ROW',
        errorMessage: 'No Friend row for (nick, contact) — chat trước khi sequence gửi message',
        retryable: false,
      };
    }
    if (friend.friendshipStatus !== 'accepted') {
      if (friend.friendshipStatus === 'pending_sent' && friend.hasConversation) {
        logger.info(`[send-message] proceeding with pending_sent + hasConversation for contact=${ctx.contactId}`);
      } else {
        return {
          outcome: 'failure',
          errorCode: 'FRIENDSHIP_NOT_ACCEPTED',
          errorMessage: `Friend status '${friend.friendshipStatus}' không cho phép gửi tin (cần 'accepted')`,
          retryable: false,
        };
      }
    }
    threadId = friend.zaloUidInNick;
    threadType = 0;
  }

  // Step 2: get-or-create Conversation
  let conversation = await prisma.conversation.findUnique({
    where: { zaloAccountId_externalThreadId: { zaloAccountId: ctx.assignedNickId, externalThreadId: threadId } },
    select: { id: true },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        id: randomUUID(),
        orgId: ctx.orgId,
        zaloAccountId: ctx.assignedNickId,
        externalThreadId: threadId,
        threadType: threadType === 1 ? 'group' : 'user',
        contactId: threadType === 1 ? null : recipientContactId,
      },
      select: { id: true },
    });
  }

  // Step 3: send via Zalo SDK — dispatch based on first attachment kind.
  // FIX B1: previously attachments were logged-warn and dropped (text-only).
  // Now supports image/video/file via dedicated zaloOps methods.
  let sdkResult: Record<string, unknown>;
  const tmpAttachmentCleanupDirs: string[] = [];
  try {
    if (attachments.length > 0) {
      const first = attachments[0];
      const url = first.url;
      const caption = first.caption || text;
      let raw: unknown;
      if (first.kind === 'image') {
        const imageAttachments = attachments.filter((item) => item.kind === 'image');
        const localPaths: string[] = [];
        for (const image of imageAttachments) {
          const localPath = image.filePath || (await downloadAttachmentUrlToTemp(image.url, 'image')).filePath;
          if (!image.filePath) {
            tmpAttachmentCleanupDirs.push(path.dirname(localPath));
          }
          localPaths.push(localPath);
        }
        raw = await zaloOps.sendFile(ctx.assignedNickId, threadId, threadType, localPaths, null, caption);
      } else if (first.kind === 'video') {
        // Video: zaloOps.sendVideo({ videoUrl, thumbnailUrl, msg })
        raw = await zaloOps.sendVideo(ctx.assignedNickId, threadId, threadType, {
          videoUrl: url,
          thumbnailUrl: first.thumbnailUrl ?? url,
          msg: caption,
        });
      } else if (first.kind === 'file') {
        // sendFile expects file path array. If URL is http, the worker can't fetch
        // server-side without download — currently passes URL string as path.
        // Zalo SDK behavior: file path must exist on the running server.
        // TODO: download URL → temp file for non-filesystem URLs.
        raw = await zaloOps.sendFile(ctx.assignedNickId, threadId, threadType, [url], null, caption);
      } else if (first.kind === 'link') {
        // Link card uses sendLink with link payload
        raw = await zaloOps.sendLink(ctx.assignedNickId, threadId, threadType, { href: url, title: caption, desc: text });
      } else {
        // Unknown kind: fall back to text-only with URL appended
        raw = await zaloOps.sendMessage(ctx.assignedNickId, threadId, threadType, { msg: `${text}\n${url}` });
      }
      sdkResult = (raw as Record<string, unknown>) || {};
    } else {
      const raw = await zaloOps.sendMessage(ctx.assignedNickId, threadId, threadType, { msg: text });
      sdkResult = (raw as Record<string, unknown>) || {};
    }
  } catch (err: any) {
    const code = err?.code as string | undefined;
    const msg = err?.message ?? String(err);
    if (code === 'RATE_LIMITED') {
      return { outcome: 'failure', errorCode: 'RATE_LIMITED', errorMessage: msg, retryable: true };
    }
    if (code === 'NOT_CONNECTED') {
      return { outcome: 'failure', errorCode: 'NOT_CONNECTED', errorMessage: msg, retryable: true };
    }
    return {
      outcome: 'failure',
      errorCode: 'SEND_MESSAGE_FAILED',
      errorMessage: msg,
      retryable: false,
    };
  } finally {
    await Promise.all(
      tmpAttachmentCleanupDirs.map((dir) => rm(dir, { recursive: true, force: true })),
    ).catch((err) => {
      logger.warn(`[send-message] cleanup temp attachments failed: ${(err as Error)?.message ?? String(err)}`);
    });
  }

  // Step 4: extract zaloMsgId for dedup with self-listen echo
  const sr = sdkResult as { message?: { msgId?: number | string } | null; msgId?: number | string };
  const rawId = sr?.message?.msgId ?? sr?.msgId ?? '';
  const zaloMsgId = String(rawId || '');

  // Step 5: persist outbound Message row
  // contentType reflects attachment kind for proper UI rendering
  const persistContentType = attachments.length > 0
    ? (attachments[0].kind === 'image' ? 'image'
      : attachments[0].kind === 'video' ? 'video'
        : attachments[0].kind === 'file' ? 'file'
          : attachments[0].kind === 'link' ? 'link'
            : 'text')
    : 'text';
  const persistContent = attachments.length > 0
    ? JSON.stringify({ text, attachments })
    : text;

  let messageRow: { id: string; content: string | null; contentType: string; sentAt: Date };
  try {
    messageRow = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId: conversation.id,
        zaloMsgId: zaloMsgId || null,
        zaloMsgIdNum: zaloMsgId && /^\d+$/.test(zaloMsgId) ? BigInt(zaloMsgId) : null,
        senderType: 'self',
        senderUid: '',
        senderName: 'Bot-Auto',
        content: persistContent,
        contentType: persistContentType,
        sentAt: new Date(),
        // Phase metrics 2026-05-22: bot gửi
        sentVia: 'automation',
      },
      select: { id: true, content: true, contentType: true, sentAt: true },
    });
  } catch (err) {
    logger.error(`[send-message] message persistence failed (Zalo send succeeded):`, err);
    // SDK already sent — return success with warning so retry doesn't double-send
    return {
      outcome: 'success',
      data: { zaloMsgId, textUsed: text, persistenceFailed: true },
    };
  }

  // Step 6: apply aggregates (Contact + Friend lastOutbound counters)
  const aggInput = {
    conversationId: conversation.id,
    message: {
      id: messageRow.id,
      content: messageRow.content,
      contentType: messageRow.contentType,
      sentAt: messageRow.sentAt,
      senderType: 'self' as const,
    },
    outboundUserId: null, // automation-sent, not user-attributed
  };
  if (!isGroupTarget) {
    void applyContactAggregateFromMessage(aggInput);
    void applyFriendAggregate(aggInput);
  }

  logger.info(`[send-message] sent from nick=${ctx.assignedNickId} to contact=${ctx.contactId}, msgId=${zaloMsgId}`);
  return {
    outcome: 'success',
    data: {
      zaloMsgId,
      textUsed: text,
      conversationId: conversation.id,
      messageId: messageRow.id,
    },
  };
}
