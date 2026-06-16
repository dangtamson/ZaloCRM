import { describe, expect, it } from 'vitest';

import { resolveAutomationTaskContactId } from '../src/modules/automation/engine/task-contact-resolution.js';

describe('resolveAutomationTaskContactId', () => {
    it('prefers __recipientContactId from block snapshot', () => {
        expect(resolveAutomationTaskContactId({ __recipientContactId: 'contact-recipient' }, 'contact-fallback'))
            .toBe('contact-recipient');
    });

    it('uses the unique explicit user target contactId when present', () => {
        expect(resolveAutomationTaskContactId({
            userTargets: [{ accountId: 'nick-1', contactId: 'contact-user' }],
        }, 'contact-fallback')).toBe('contact-user');
    });

    it('falls back when block snapshot contains multiple explicit user target contactIds', () => {
        expect(resolveAutomationTaskContactId({
            userTargets: [
                { accountId: 'nick-1', contactId: 'contact-1' },
                { accountId: 'nick-2', contactId: 'contact-2' },
            ],
        }, 'contact-fallback')).toBe('contact-fallback');
    });
});