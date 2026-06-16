import type { SendMessageTarget } from './send-message-targets.js';

export function resolveAutomationTaskContactId(
    blockSnapshot: unknown,
    fallbackContactId: string,
): string {
    if (!blockSnapshot || typeof blockSnapshot !== 'object' || Array.isArray(blockSnapshot)) {
        return fallbackContactId;
    }

    const snapshot = blockSnapshot as Record<string, unknown>;
    const recipientContactId = readString(snapshot.__recipientContactId);
    if (recipientContactId) return recipientContactId;

    const explicitUserContactIds = Array.from(new Set(
        readUserTargets(snapshot.userTargets).map((target) => target.contactId),
    ));
    if (explicitUserContactIds.length === 1) {
        return explicitUserContactIds[0];
    }

    return fallbackContactId;
}

function readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readUserTargets(value: unknown): Array<Extract<SendMessageTarget, { kind: 'user' }>> {
    if (!Array.isArray(value) || value.length === 0) return [];
    return value
        .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
            const accountId = readString((item as Record<string, unknown>).accountId);
            const contactId = readString((item as Record<string, unknown>).contactId);
            return accountId && contactId ? { kind: 'user', accountId, contactId } : null;
        })
        .filter((item): item is Extract<SendMessageTarget, { kind: 'user' }> => Boolean(item));
}