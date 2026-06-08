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
  // Optional direct group destination for legacy single-target blocks.
  // New blocks should prefer `groupTargets[]`.
  groupTarget?: {
    accountId: string;
    groupId: string;
  };
  // Batch group targets. Each item sends to a Zalo group thread with the
  // selected nick. Engine sends them sequentially with a delay between sends.
  groupTargets?: Array<{
    accountId: string;
    groupId: string;
  }>;
  // Batch user targets. Each item sends to a contact thread with the selected nick.
  userTargets?: Array<{
    accountId: string;
    contactId: string;
  }>;
  // Optional HTML template rendered into an image file before sending.
  htmlImageTemplate?: {
    html: string;
    width?: number;
    height?: number;
    failOpen?: boolean;
  };
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

      const groupTarget = c.groupTarget;
      if (groupTarget !== undefined && groupTarget !== null) {
        if (typeof groupTarget !== 'object') {
          return { ok: false, error: 'groupTarget phải là object' };
        }
        const gt = groupTarget as Record<string, unknown>;
        if (typeof gt.accountId !== 'string' || !gt.accountId.trim()) {
          return { ok: false, error: 'groupTarget.accountId phải là chuỗi không rỗng' };
        }
        if (typeof gt.groupId !== 'string' || !gt.groupId.trim()) {
          return { ok: false, error: 'groupTarget.groupId phải là chuỗi không rỗng' };
        }
      }

      const groupTargets = c.groupTargets;
      if (groupTargets !== undefined && groupTargets !== null) {
        if (!Array.isArray(groupTargets) || groupTargets.length === 0) {
          return { ok: false, error: 'groupTargets phải là mảng có ít nhất 1 phần tử' };
        }
        for (const item of groupTargets) {
          if (typeof item !== 'object' || item === null) {
            return { ok: false, error: 'mỗi groupTargets item phải là object' };
          }
          const gt = item as Record<string, unknown>;
          if (typeof gt.accountId !== 'string' || !gt.accountId.trim()) {
            return { ok: false, error: 'groupTargets.accountId phải là chuỗi không rỗng' };
          }
          if (typeof gt.groupId !== 'string' || !gt.groupId.trim()) {
            return { ok: false, error: 'groupTargets.groupId phải là chuỗi không rỗng' };
          }
        }
      }

      const userTargets = c.userTargets;
      if (userTargets !== undefined && userTargets !== null) {
        if (!Array.isArray(userTargets) || userTargets.length === 0) {
          return { ok: false, error: 'userTargets phải là mảng có ít nhất 1 phần tử' };
        }
        for (const item of userTargets) {
          if (typeof item !== 'object' || item === null) {
            return { ok: false, error: 'mỗi userTargets item phải là object' };
          }
          const ut = item as Record<string, unknown>;
          if (typeof ut.accountId !== 'string' || !ut.accountId.trim()) {
            return { ok: false, error: 'userTargets.accountId phải là chuỗi không rỗng' };
          }
          if (typeof ut.contactId !== 'string' || !ut.contactId.trim()) {
            return { ok: false, error: 'userTargets.contactId phải là chuỗi không rỗng' };
          }
        }
      }

      const htmlTpl = c.htmlImageTemplate;
      if (htmlTpl !== undefined && htmlTpl !== null) {
        if (typeof htmlTpl !== 'object') {
          return { ok: false, error: 'htmlImageTemplate phải là object' };
        }
        const tpl = htmlTpl as Record<string, unknown>;
        if (typeof tpl.html !== 'string' || !tpl.html.trim()) {
          return { ok: false, error: 'htmlImageTemplate.html phải là chuỗi không rỗng' };
        }
        if (tpl.width !== undefined && (typeof tpl.width !== 'number' || tpl.width < 320 || tpl.width > 3000)) {
          return { ok: false, error: 'htmlImageTemplate.width phải là số trong khoảng 320-3000' };
        }
        if (tpl.height !== undefined && (typeof tpl.height !== 'number' || tpl.height < 320 || tpl.height > 4000)) {
          return { ok: false, error: 'htmlImageTemplate.height phải là số trong khoảng 320-4000' };
        }
        if (tpl.failOpen !== undefined && typeof tpl.failOpen !== 'boolean') {
          return { ok: false, error: 'htmlImageTemplate.failOpen phải là boolean' };
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
