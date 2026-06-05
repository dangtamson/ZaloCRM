// Phase 7 — Block types & content schema.
//
// Block.actionType discriminates content shape. Engine reads block.content
// based on actionType to dispatch to the right action handler.
//
// Phase G ship first 3 actions: request_friend, send_message, update_status.
// Other actionTypes here are reserved for future phases (do NOT remove from
// the enum — UI components key off these strings).

export type BlockChannel = 'zalo_user';

export type BlockActionType =
  | 'request_friend'
  | 'send_message'
  | 'update_status'
  // Reserved for future phases:
  | 'send_image'
  | 'send_file'
  | 'send_template'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_user'
  | 'update_lead_score';

export const SUPPORTED_ACTION_TYPES: readonly BlockActionType[] = [
  'request_friend',
  'send_message',
  'update_status',
];

// ── Content shapes per actionType ──────────────────────────────────────────
//
// `*Variants` arrays let a single block carry multiple wordings; engine picks
// one randomly at execution time to vary outgoing text across nicks (memory:
// project_zalocrm_phase7_automation — template variation per nick).

export interface RequestFriendContent {
  greetingVariants: string[]; // 1+ entries, engine picks one per execution
}

export interface MessageAttachment {
  kind: 'image' | 'video' | 'file' | 'link';
  url: string;
  caption?: string;
  // Optional: thumbnail for video, alt text for image
  thumbnailUrl?: string;
  altText?: string;
}

/**
 * Optional AI image generation config for `send_message` blocks.
 *
 * When present, the engine renders `prompt` with the same template variables
 * as text variants (e.g. {{contact.fullName}}), calls the configured image
 * provider, downloads the result into the automation assets directory, and
 * prepends it as an `image` attachment to the outgoing Zalo message.
 *
 * `provider` is optional — falls back to AI_IMAGE_DEFAULT_PROVIDER env.
 * `failOpen=true` (default) means: if image gen fails, still send the text
 * message without the image. Set `false` to abort the whole step on failure.
 */
export interface AiImagePrompt {
  prompt: string;
  provider?: 'openai' | 'gemini' | 'custom';
  model?: string;
  size?: string;
  failOpen?: boolean;
}

export interface SendMessageContent {
  textVariants: string[];
  attachments?: MessageAttachment[];
  aiImagePrompt?: AiImagePrompt;
}

export interface UpdateStatusContent {
  statusId: string;
  // Optional: only apply if contact currently in one of these statuses
  onlyFromStatusIds?: string[];
}

export type BlockContent =
  | RequestFriendContent
  | SendMessageContent
  | UpdateStatusContent;

// ── Validators ─────────────────────────────────────────────────────────────
//
// Each returns `{ ok: true }` or `{ ok: false, error: 'human readable msg' }`.
// Called by block routes on create/update + by engine before execute.

export function validateBlockContent(
  actionType: BlockActionType,
  content: unknown,
): { ok: true } | { ok: false; error: string } {
  if (typeof content !== 'object' || content === null) {
    return { ok: false, error: 'content phải là object' };
  }
  const c = content as Record<string, unknown>;

  switch (actionType) {
    case 'request_friend': {
      const variants = c.greetingVariants;
      if (!Array.isArray(variants) || variants.length === 0) {
        return { ok: false, error: 'greetingVariants phải là mảng có ít nhất 1 phần tử' };
      }
      if (!variants.every((v) => typeof v === 'string' && v.trim().length > 0)) {
        return { ok: false, error: 'mỗi greetingVariant phải là chuỗi không rỗng' };
      }
      return { ok: true };
    }

    case 'send_message': {
      const variants = c.textVariants;
      if (!Array.isArray(variants) || variants.length === 0) {
        return { ok: false, error: 'textVariants phải là mảng có ít nhất 1 phần tử' };
      }
      if (!variants.every((v) => typeof v === 'string' && v.trim().length > 0)) {
        return { ok: false, error: 'mỗi textVariant phải là chuỗi không rỗng' };
      }
      const atts = c.attachments;
      if (atts !== undefined) {
        if (!Array.isArray(atts)) return { ok: false, error: 'attachments phải là mảng' };
        for (const att of atts) {
          if (typeof att !== 'object' || att === null) {
            return { ok: false, error: 'mỗi attachment phải là object' };
          }
          const a = att as Record<string, unknown>;
          if (!['image', 'video', 'file', 'link'].includes(a.kind as string)) {
            return { ok: false, error: 'attachment.kind phải là image | video | file | link' };
          }
          if (typeof a.url !== 'string' || !a.url) {
            return { ok: false, error: 'attachment.url phải là chuỗi không rỗng' };
          }
        }
      }
      // Optional AI image generation config — validates shape but does NOT
      // contact the provider (validators stay pure for unit testability).
      const aiCfg = c.aiImagePrompt;
      if (aiCfg !== undefined && aiCfg !== null) {
        if (typeof aiCfg !== 'object') {
          return { ok: false, error: 'aiImagePrompt phải là object' };
        }
        const ai = aiCfg as Record<string, unknown>;
        if (typeof ai.prompt !== 'string' || !ai.prompt.trim()) {
          return { ok: false, error: 'aiImagePrompt.prompt phải là chuỗi không rỗng' };
        }
        if (ai.prompt.length > 4000) {
          return { ok: false, error: 'aiImagePrompt.prompt tối đa 4000 ký tự' };
        }
        if (ai.provider !== undefined && !['openai', 'gemini', 'custom'].includes(ai.provider as string)) {
          return { ok: false, error: 'aiImagePrompt.provider phải là openai | gemini | custom' };
        }
        if (ai.model !== undefined && (typeof ai.model !== 'string' || ai.model.length > 100)) {
          return { ok: false, error: 'aiImagePrompt.model phải là chuỗi ≤100 ký tự' };
        }
        if (ai.size !== undefined) {
          if (typeof ai.size !== 'string' || !/^\d{2,5}x\d{2,5}$/.test(ai.size)) {
            return { ok: false, error: 'aiImagePrompt.size phải là dạng "WIDTHxHEIGHT" (vd 1024x1024)' };
          }
        }
        if (ai.failOpen !== undefined && typeof ai.failOpen !== 'boolean') {
          return { ok: false, error: 'aiImagePrompt.failOpen phải là boolean' };
        }
      }
      return { ok: true };
    }

    case 'update_status': {
      if (typeof c.statusId !== 'string' || !c.statusId) {
        return { ok: false, error: 'statusId phải là chuỗi không rỗng' };
      }
      if (c.onlyFromStatusIds !== undefined && !Array.isArray(c.onlyFromStatusIds)) {
        return { ok: false, error: 'onlyFromStatusIds phải là mảng' };
      }
      return { ok: true };
    }

    default:
      return { ok: false, error: `actionType '${actionType}' chưa được hỗ trợ ở phase này` };
  }
}

export function isSupportedActionType(value: unknown): value is BlockActionType {
  return typeof value === 'string' && SUPPORTED_ACTION_TYPES.includes(value as BlockActionType);
}
