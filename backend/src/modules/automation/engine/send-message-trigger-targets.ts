type GroupTarget = { accountId: string; groupId: string };
type UserTarget = { accountId: string; contactId: string };

export type SendMessageTargetOverrides = {
  groupTargets: GroupTarget[];
  userTargets: UserTarget[];
};

export function readSendMessageTargetOverrides(ruleOverrides: unknown): SendMessageTargetOverrides | null {
  if (!isObject(ruleOverrides)) return null;
  const sendMessageTargets = ruleOverrides.sendMessageTargets;
  if (!isObject(sendMessageTargets)) return null;

  const groupTargets = readGroupTargets(sendMessageTargets.groupTargets);
  const userTargets = readUserTargets(sendMessageTargets.userTargets);
  if (groupTargets.length === 0 && userTargets.length === 0) return null;
  return { groupTargets, userTargets };
}

export function applySendMessageTargetOverrides(
  content: unknown,
  ruleOverrides: unknown,
): Record<string, unknown> {
  const snapshot = content && typeof content === 'object' && !Array.isArray(content)
    ? { ...(content as Record<string, unknown>) }
    : {};
  applyTelegramMessageTarget(snapshot, ruleOverrides);
  const targets = readSendMessageTargetOverrides(ruleOverrides);
  if (!targets) return snapshot;

  delete snapshot.groupTarget;
  delete snapshot.groupTargets;
  delete snapshot.userTargets;
  if (targets.groupTargets.length > 0) snapshot.groupTargets = targets.groupTargets;
  if (targets.userTargets.length > 0) snapshot.userTargets = targets.userTargets;
  return snapshot;
}

function applyTelegramMessageTarget(snapshot: Record<string, unknown>, ruleOverrides: unknown): void {
  if (!isObject(ruleOverrides)) return;
  const target = ruleOverrides.telegramMessageTarget;
  if (!isObject(target)) {
    delete snapshot.telegramMessageTarget;
    return;
  }
  const integrationId = readString(target.integrationId);
  if (integrationId) snapshot.telegramMessageTarget = { integrationId };
  else delete snapshot.telegramMessageTarget;
}

function readGroupTargets(value: unknown): GroupTarget[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => isObject(item)
      ? { accountId: readString(item.accountId), groupId: readString(item.groupId) }
      : null)
    .filter((item): item is GroupTarget => Boolean(item?.accountId && item.groupId));
}

function readUserTargets(value: unknown): UserTarget[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => isObject(item)
      ? { accountId: readString(item.accountId), contactId: readString(item.contactId) }
      : null)
    .filter((item): item is UserTarget => Boolean(item?.accountId && item.contactId));
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
