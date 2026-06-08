export type SendMessageGroupTarget = {
  accountId: string;
  groupId: string;
};

export type SendMessageUserTarget = {
  accountId: string;
  contactId: string;
};

export type SendMessageTarget =
  | { kind: 'group'; accountId: string; groupId: string }
  | { kind: 'user'; accountId: string; contactId: string };

export function normalizeSendMessageTargets(snapshot: Record<string, unknown>): SendMessageTarget[] {
  const explicitGroupTargets = readGroupTargets(snapshot.groupTargets);
  const explicitUserTargets = readUserTargets(snapshot.userTargets);
  if (explicitGroupTargets.length > 0 || explicitUserTargets.length > 0) {
    return [...explicitGroupTargets, ...explicitUserTargets];
  }

  if (snapshot.__batchNoLegacy === true) {
    return [];
  }

  const legacyGroupTarget = snapshot.groupTarget;
  if (isObject(legacyGroupTarget)) {
    const accountId = readString(legacyGroupTarget.accountId);
    const groupId = readString(legacyGroupTarget.groupId);
    if (accountId && groupId) {
      return [{ kind: 'group', accountId, groupId }];
    }
  }

  return [];
}

export function hasExplicitSendMessageTargets(snapshot: Record<string, unknown>): boolean {
  return normalizeSendMessageTargets(snapshot).length > 0;
}

function readGroupTargets(value: unknown): SendMessageTarget[] {
  if (!Array.isArray(value) || value.length === 0) return [];
  const out: SendMessageTarget[] = [];
  for (const item of value) {
    if (!isObject(item)) continue;
    const accountId = readString(item.accountId);
    const groupId = readString(item.groupId);
    if (accountId && groupId) {
      out.push({ kind: 'group', accountId, groupId });
    }
  }
  return out;
}

function readUserTargets(value: unknown): SendMessageTarget[] {
  if (!Array.isArray(value) || value.length === 0) return [];
  const out: SendMessageTarget[] = [];
  for (const item of value) {
    if (!isObject(item)) continue;
    const accountId = readString(item.accountId);
    const contactId = readString(item.contactId);
    if (accountId && contactId) {
      out.push({ kind: 'user', accountId, contactId });
    }
  }
  return out;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
