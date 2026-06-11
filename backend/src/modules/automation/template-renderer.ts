export interface AutomationTemplateContext {
  org?: { id: string; name: string | null } | null;
  contact?: {
    id: string;
    fullName: string | null;
    crmName?: string | null;
    phone: string | null;
    email?: string | null;
    status: string | null;
    birthDate?: Date | string | null;
    gender?: string | null;
    occupation?: string | null;
    unit?: string | null;
    birthdayWish?: string | null;
    tags?: unknown; // stored as Json in DB — cast to string[] when joining
    zaloName?: string | null; // resolved from Zalo API, not in DB
  } | null;
  conversation?: { id: string } | null;
}

function salutation(context: AutomationTemplateContext): string {
  const g = (context.contact?.gender ?? '').toLowerCase();
  if (g === 'male') return 'Anh';
  if (g === 'female') return 'Chị';
  return 'Bạn';
}

function defaultBirthdayWishLines(context: AutomationTemplateContext): string[] {
  const s = salutation(context);
  const unit = context.contact?.unit || context.org?.name || 'VNPT';
  return [
    `Nhân dịp sinh nhật của ${s}, kính chúc ${s} luôn`,
    'dồi dào sức khỏe, hạnh phúc, thành công và tiếp tục',
    `đồng hành cùng với đơn vị phát triển vững mạnh,`,
    'hoàn thành xuất sắc mọi nhiệm vụ, đóng góp tích cực',
    'vào sự phát triển chung của VNPT.',
  ];
}

function wrapWords(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function birthdayWishLines(context: AutomationTemplateContext): string[] {
  const custom = context.contact?.birthdayWish?.trim();
  if (!custom) return defaultBirthdayWishLines(context);
  const lines = wrapWords(custom, 48, 5);
  while (lines.length < 5) lines.push('');
  return lines;
}

const TEMPLATE_VARIABLES: Record<string, (context: AutomationTemplateContext) => string> = {
  // Contact fields
  'contact.fullName': (ctx) => ctx.contact?.fullName ?? '',
  'contact.phone': (ctx) => ctx.contact?.phone ?? '',
  'contact.email': (ctx) => ctx.contact?.email ?? '',
  'contact.status': (ctx) => ctx.contact?.status ?? '',
  'contact.birthDate': (ctx) => {
    const value = ctx.contact?.birthDate;
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN').format(date);
  },
  'contact.gender': (ctx) => ctx.contact?.gender ?? '',
  'contact.occupation': (ctx) => ctx.contact?.occupation ?? '',
  'contact.unit': (ctx) => ctx.contact?.unit ?? '',
  'contact.birthdayWish': (ctx) => (ctx.contact?.birthdayWish?.trim() || defaultBirthdayWishLines(ctx).join('\n')),
  'contact.birthdayWishLine1': (ctx) => birthdayWishLines(ctx)[0] ?? '',
  'contact.birthdayWishLine2': (ctx) => birthdayWishLines(ctx)[1] ?? '',
  'contact.birthdayWishLine3': (ctx) => birthdayWishLines(ctx)[2] ?? '',
  'contact.birthdayWishLine4': (ctx) => birthdayWishLines(ctx)[3] ?? '',
  'contact.birthdayWishLine5': (ctx) => birthdayWishLines(ctx)[4] ?? '',
  'contact.salutation': (ctx) => salutation(ctx),
  'contact.crmName': (ctx) => ctx.contact?.crmName ?? ctx.contact?.fullName ?? '',
  'contact.zaloName': (ctx) => ctx.contact?.zaloName ?? ctx.contact?.fullName ?? '',
  'contact.tags': (ctx) => {
    const tags = ctx.contact?.tags;
    if (!tags) return '';
    if (Array.isArray(tags)) return (tags as string[]).join(', ');
    return '';
  },

  // Conversation fields
  'conversation.id': (ctx) => ctx.conversation?.id ?? '',

  // Org fields
  'org.name': (ctx) => ctx.org?.name ?? '',

  // Date/time helpers (Vietnamese locale)
  'date.today': () => new Intl.DateTimeFormat('vi-VN').format(new Date()),
  'date.now': () =>
    new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
};

/** All variable names available for template authoring UI */
export const AVAILABLE_VARIABLES: string[] = Object.keys(TEMPLATE_VARIABLES);

export function renderMessageTemplate(content: string, context: AutomationTemplateContext): string {
  return content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, token: string) => {
    const resolver = TEMPLATE_VARIABLES[token];
    return resolver ? resolver(context) : '';
  });
}
