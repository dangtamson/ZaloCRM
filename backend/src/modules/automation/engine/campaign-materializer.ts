// Phase 7 Engine — Campaign materializer.
//
// Bridges the gap between Trigger event firing and AutomationTask creation.
//
// Flow:
//   1. AutomationEvent arrives via event-bus
//   2. Find enabled triggers matching eventType in this org
//   3. For each trigger:
//      a. Pass eventFilter (loose equality on payload keys for now)
//      b. Resolve contactIds (single contactId from event, OR segment query)
//      c. For each contact: pass segmentSpec match → materialize Campaign + Task
//   4. Reuse existing active Campaign if same (triggerId, sequenceId) exists
//      to avoid spawning duplicate state machines per contact (idempotent on
//      double-fire). 1 contact may be in 1 active campaign per sequence.

import { randomUUID } from 'node:crypto';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { DEFAULT_RUNTIME_RULES, type SequenceStep } from '../sequences/types.js';
import type { AutomationEvent } from './types.js';
import { sanitizeContactCriteria, sanitizeManualContactIds } from './segment-sanitizer.js';
import { applySendMessageTargetOverrides } from './send-message-trigger-targets.js';

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

interface CustomerListEntryProfile {
  nameRaw: string | null;
  birthDate: Date | null;
  gender: string | null;
  occupation: string | null;
  unit: string | null;
  birthdayWish: string | null;
}

interface TemplateContactOverride {
  fullName?: string;
  crmName?: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  unit?: string;
  birthdayWish?: string;
}

interface SegmentResolution {
  contactIds: string[];
  templateProfileByContactId: Map<string, TemplateContactOverride>;
  templateProfiles: TemplateContactOverride[];
}

function getVnNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: VN_TIMEZONE }));
}

function toMonthDayKey(date: Date): number {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function getBirthdayWeekMonthDayKeys(now: Date): Set<number> {
  // Monday to Sunday week window in VN time.
  const current = new Date(now);
  const day = current.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  const keys = new Set<number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.add(toMonthDayKey(d));
  }
  return keys;
}

function emptySegmentResolution(contactIds: string[] = []): SegmentResolution {
  return { contactIds, templateProfileByContactId: new Map(), templateProfiles: [] };
}

function toTemplateContactOverride(profile: CustomerListEntryProfile): TemplateContactOverride {
  const override: TemplateContactOverride = {};
  if (profile.nameRaw?.trim()) {
    override.fullName = profile.nameRaw.trim();
    override.crmName = profile.nameRaw.trim();
  }
  if (profile.birthDate) override.birthDate = profile.birthDate.toISOString();
  if (profile.gender?.trim()) override.gender = profile.gender.trim();
  if (profile.occupation?.trim()) override.occupation = profile.occupation.trim();
  if (profile.unit?.trim()) override.unit = profile.unit.trim();
  if (profile.birthdayWish?.trim()) override.birthdayWish = profile.birthdayWish.trim();
  return override;
}

function buildTaskBlockSnapshot(
  content: unknown,
  templateProfile?: TemplateContactOverride,
  templateProfiles?: TemplateContactOverride[],
  ruleOverrides?: unknown,
): object {
  const snapshot = applySendMessageTargetOverrides(content, ruleOverrides);
  const nonEmptyProfiles = Array.isArray(templateProfiles)
    ? templateProfiles.filter((profile) => Object.keys(profile).length > 0)
    : [];
  if (nonEmptyProfiles.length > 1) {
    snapshot.__templateContactOverrides = nonEmptyProfiles;
  } else if (templateProfile && Object.keys(templateProfile).length > 0) {
    snapshot.__templateContactOverride = templateProfile;
  }
  return snapshot;
}

function hasHtmlImageTemplate(content: unknown): boolean {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return false;
  const template = (content as Record<string, unknown>).htmlImageTemplate;
  return Boolean(template && typeof template === 'object' && !Array.isArray(template));
}

function getTemplateProfilesForContactIds(
  contactIds: string[],
  profileByContactId: Map<string, TemplateContactOverride>,
): TemplateContactOverride[] {
  return contactIds
    .map((contactId) => profileByContactId.get(contactId))
    .filter((profile): profile is TemplateContactOverride => Boolean(profile));
}

function getPayloadTriggerId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const triggerId = (payload as Record<string, unknown>).triggerId;
  return typeof triggerId === 'string' && triggerId.trim() ? triggerId.trim() : undefined;
}

async function resolveCustomerListContacts(
  orgId: string,
  listId: string,
  birthdayThisWeek: boolean,
): Promise<SegmentResolution> {
  const entries = await prisma.customerListEntry.findMany({
    where: {
      customerListId: listId,
      status: { in: ['enriched', 'validated'] },
      phoneValid: true,
      ...(birthdayThisWeek ? { birthDate: { not: null } } : {}),
    },
    select: {
      phoneE164: true,
      contactId: true,
      dupWithContactId: true,
      nameRaw: true,
      birthDate: true,
      gender: true,
      occupation: true,
      unit: true,
      birthdayWish: true,
    } as never,
    take: 50000,
  }) as Array<{
    phoneE164: string | null;
    contactId: string | null;
    dupWithContactId: string | null;
    nameRaw: string | null;
    birthDate: Date | null;
    gender: string | null;
    occupation: string | null;
    unit: string | null;
    birthdayWish: string | null;
  }>;

  const weekKeys = birthdayThisWeek ? getBirthdayWeekMonthDayKeys(getVnNow()) : null;
  const inBirthdayWeek = (birthDate: Date | null): boolean => {
    if (!weekKeys) return true;
    if (!birthDate) return false;
    return weekKeys.has(toMonthDayKey(new Date(birthDate)));
  };

  const linkedContactIds = entries
    .filter((e) => inBirthdayWeek(e.birthDate))
    .flatMap((e) => [e.contactId, e.dupWithContactId])
    .filter((id): id is string => Boolean(id));
  const eligibleProfiles = entries
    .filter((e) => inBirthdayWeek(e.birthDate))
    .map((e) => toTemplateContactOverride({
      nameRaw: e.nameRaw,
      birthDate: e.birthDate,
      gender: e.gender,
      occupation: e.occupation,
      unit: e.unit,
      birthdayWish: e.birthdayWish,
    }))
    .filter((profile) => Object.keys(profile).length > 0);

  const phones84 = entries
    .filter((e) => !e.contactId && !e.dupWithContactId && e.phoneE164 && inBirthdayWeek(e.birthDate))
    .map((e) => e.phoneE164!.replace(/^\+/, ''));

  const allIds = new Set<string>(linkedContactIds);
  const linkedProfileByContactId = new Map<string, CustomerListEntryProfile>();
  for (const e of entries) {
    if (!inBirthdayWeek(e.birthDate)) continue;
    for (const id of [e.contactId, e.dupWithContactId]) {
      if (!id || linkedProfileByContactId.has(id)) continue;
      linkedProfileByContactId.set(id, {
        nameRaw: e.nameRaw,
        birthDate: e.birthDate,
        gender: e.gender,
        occupation: e.occupation,
        unit: e.unit,
        birthdayWish: e.birthdayWish,
      });
    }
  }
  if (phones84.length > 0) {
    const matched = await prisma.contact.findMany({
      where: { orgId, phoneNormalized: { in: phones84 } },
      select: { id: true, phoneNormalized: true },
      take: 50000,
    });
    const profileByPhone = new Map<string, CustomerListEntryProfile>();
    for (const e of entries) {
      if (!e.phoneE164 || !inBirthdayWeek(e.birthDate)) continue;
      const key = e.phoneE164.replace(/^\+/, '');
      if (!profileByPhone.has(key)) {
        profileByPhone.set(key, {
          nameRaw: e.nameRaw,
          birthDate: e.birthDate,
          gender: e.gender,
          occupation: e.occupation,
          unit: e.unit,
          birthdayWish: e.birthdayWish,
        });
      }
    }
    for (const c of matched) {
      allIds.add(c.id);
      const profile = c.phoneNormalized ? profileByPhone.get(c.phoneNormalized) : null;
      if (profile && !linkedProfileByContactId.has(c.id)) {
        linkedProfileByContactId.set(c.id, profile);
      }
    }
  }

  return {
    contactIds: Array.from(allIds),
    templateProfileByContactId: new Map(
      Array.from(linkedProfileByContactId.entries()).map(([contactId, profile]) => [
        contactId,
        toTemplateContactOverride(profile),
      ]),
    ),
    templateProfiles: eligibleProfiles,
  };
}

async function findTaskAnchorContactId(orgId: string): Promise<string | null> {
  const sample = await prisma.contact.findFirst({
    where: { orgId, mergedInto: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return sample?.id ?? null;
}

export interface MaterializeResult {
  campaignsCreated: number;
  tasksEnqueued: number;
  skipped: number;
  reasons: string[];
}

// Loose event filter: every key in `filter` must equal (or includes for arrays)
// the value in payload at that key. Missing keys = no match.
function matchesEventFilter(
  filter: Record<string, unknown> | null,
  payload: unknown,
): boolean {
  if (!filter) return true;
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  for (const [k, expected] of Object.entries(filter)) {
    const actual = p[k];
    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

// segmentSpec evaluation. Phase 7 supports 'manual' (contactIds list) and
// 'filter' (Prisma where clause subset). 'import-batch' requires the import
// phase to ship a ContactImportBatch table — soft-checked here.
async function resolveSegmentContacts(
  orgId: string,
  spec: unknown,
  hintContactId: string | null,
): Promise<SegmentResolution> {
  if (hintContactId) return emptySegmentResolution([hintContactId]); // event already names the contact

  if (!spec || typeof spec !== 'object') return emptySegmentResolution();
  const s = spec as Record<string, unknown>;

  if (s.kind === 'manual' && Array.isArray(s.contactIds)) {
    // SECURITY FIX (A1): validate ids belong to this org before returning.
    const safeIds = sanitizeManualContactIds(s.contactIds);
    if (safeIds.length === 0) return emptySegmentResolution();
    const verified = await prisma.contact.findMany({
      where: { id: { in: safeIds }, orgId },
      select: { id: true },
    });
    return emptySegmentResolution(verified.map((c) => c.id));
  }

  if (s.kind === 'filter' && typeof s.criteria === 'object' && s.criteria !== null) {
    // SECURITY FIX (A1): force orgId AND-scope, strip non-whitelisted fields.
    // Previously `{ orgId, ...criteria }` allowed criteria.orgId override → cross-tenant leak.
    const result = sanitizeContactCriteria(orgId, s.criteria);
    if (!result.ok || !result.where) return emptySegmentResolution();
    if (result.rejected?.length) {
      logger.warn(`[materializer] segmentSpec criteria rejected fields: ${result.rejected.join(', ')}`);
    }
    const rows = await prisma.contact.findMany({
      where: result.where,
      select: { id: true },
      take: 10000,
    });
    return emptySegmentResolution(rows.map((r) => r.id));
  }

  if (s.kind === 'customer-list' && typeof s.listId === 'string') {
    const birthdayThisWeek = s.birthdayThisWeek === true;
    return resolveCustomerListContacts(orgId, s.listId, birthdayThisWeek);
  }

  // import-batch: soft reference (table ships later) — skip silently for now
  return emptySegmentResolution();
}

export async function materializeFromEvent(
  event: AutomationEvent,
): Promise<MaterializeResult> {
  const result: MaterializeResult = { campaignsCreated: 0, tasksEnqueued: 0, skipped: 0, reasons: [] };
  const payloadTriggerId = getPayloadTriggerId(event.payload);

  // Find enabled triggers matching eventType in this org
  const triggers = await prisma.automationTrigger.findMany({
    where: {
      orgId: event.orgId,
      eventType: event.type,
      enabled: true,
      ...(payloadTriggerId ? { id: payloadTriggerId } : {}),
    },
    include: {
      sequence: { select: { id: true, enabled: true, steps: true, runtimeRules: true } },
    },
  });

  if (triggers.length === 0) return result;

  for (const trigger of triggers) {
    // 1. eventFilter check
    if (!matchesEventFilter(trigger.eventFilter as Record<string, unknown> | null, event.payload)) {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: eventFilter mismatch`);
      continue;
    }

    // 2. Branch by bindingKind. Broadcast-bound triggers are out of scope here
    //    (Broadcast routes have their own dedicated materializer via fire-broadcast).
    if (trigger.bindingKind === 'broadcast') {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: broadcast bindingKind handled by broadcast-scheduler`);
      continue;
    }

    // ── Block-bound: single-task campaign that runs the block directly ────
    // FIX (overnight test bug): block-bound triggers were silently skipped
    // before — only sequences materialized. Now we create a single-block
    // campaign + 1 Task per resolved contact.
    if (trigger.bindingKind === 'block') {
      if (!trigger.blockId) {
        result.skipped++;
        result.reasons.push(`trigger ${trigger.id}: block bindingKind but no blockId`);
        continue;
      }
      const block = await prisma.block.findFirst({
        where: { id: trigger.blockId, orgId: event.orgId },
        select: { id: true, content: true, archivedAt: true },
      });
      if (!block || block.archivedAt) {
        result.skipped++;
        result.reasons.push(`trigger ${trigger.id}: block missing or archived`);
        continue;
      }

      const segmentResolution = await resolveSegmentContacts(
        event.orgId,
        trigger.segmentSpec ?? event.segmentHint,
        event.contactId ?? null,
      );
      const contactIds = [...segmentResolution.contactIds];
      if (contactIds.length === 0 && hasHtmlImageTemplate(block.content) && segmentResolution.templateProfiles.length > 0) {
        const anchorContactId = await findTaskAnchorContactId(event.orgId);
        if (anchorContactId) contactIds.push(anchorContactId);
      }
      if (contactIds.length === 0) {
        result.skipped++;
        result.reasons.push(`trigger ${trigger.id}: no contacts resolved (block-bound)`);
        continue;
      }

      const rulesSnapshot = {
        ...DEFAULT_RUNTIME_RULES,
        ...((trigger.ruleOverrides as object) ?? {}),
      };

      // 1 campaign per trigger + 1 task per contact
      let blockCampaign = await prisma.automationCampaign.findFirst({
        where: {
          orgId: event.orgId,
          triggerId: trigger.id,
          blockId: trigger.blockId,
          state: 'active',
        },
        select: { id: true },
      });
      if (!blockCampaign) {
        blockCampaign = await prisma.automationCampaign.create({
          data: {
            id: randomUUID(),
            orgId: event.orgId,
            triggerId: trigger.id,
            executionKind: 'single_block',
            blockId: trigger.blockId,
            segmentSnapshot: { contactIds } as object,
            rulesSnapshot: rulesSnapshot as object,
            state: 'active',
          },
          select: { id: true },
        });
        result.campaignsCreated++;
      }

      // Apply jitter window for scheduling
      const jitterMin = (rulesSnapshot.randomDelayPerSend?.min ?? 0) * 60 * 1000;
      const jitterMax = (rulesSnapshot.randomDelayPerSend?.max ?? 0) * 60 * 1000;
      const baseNow = Date.now();
      const groupedTemplateProfiles = segmentResolution.templateProfiles.length > 0
        ? segmentResolution.templateProfiles
        : getTemplateProfilesForContactIds(
          contactIds,
          segmentResolution.templateProfileByContactId,
        );

      if (hasHtmlImageTemplate(block.content) && groupedTemplateProfiles.length > 0) {
        const groupedContactId = contactIds[0];
        const existing = await prisma.automationTask.findFirst({
          where: { campaignId: blockCampaign.id, contactId: groupedContactId },
          select: { id: true },
        });
        if (existing) {
          result.skipped++;
          result.reasons.push(`contact ${groupedContactId}: already in block campaign ${blockCampaign.id}`);
          continue;
        }
        const jitter = jitterMin + Math.random() * Math.max(0, jitterMax - jitterMin);
        const scheduledAt = new Date(baseNow + jitter);
        await prisma.automationTask.create({
          data: {
            id: randomUUID(),
            orgId: event.orgId,
            campaignId: blockCampaign.id,
            contactId: groupedContactId,
            currentBlockId: block.id,
            blockSnapshot: buildTaskBlockSnapshot(
              block.content,
              groupedTemplateProfiles[0],
              groupedTemplateProfiles,
              trigger.ruleOverrides,
            ),
            scheduledAt,
            state: 'queued',
          },
        });
        result.tasksEnqueued++;
        continue;
      }

      for (const contactId of contactIds) {
        const existing = await prisma.automationTask.findFirst({
          where: { campaignId: blockCampaign.id, contactId },
          select: { id: true },
        });
        if (existing) {
          result.skipped++;
          result.reasons.push(`contact ${contactId}: already in block campaign ${blockCampaign.id}`);
          continue;
        }
        const jitter = jitterMin + Math.random() * Math.max(0, jitterMax - jitterMin);
        const scheduledAt = new Date(baseNow + jitter);
        await prisma.automationTask.create({
          data: {
            id: randomUUID(),
            orgId: event.orgId,
            campaignId: blockCampaign.id,
            contactId,
            // No sequence — block-bound tasks have currentStepIdx=null
            currentBlockId: block.id,
            blockSnapshot: buildTaskBlockSnapshot(
              block.content,
              segmentResolution.templateProfileByContactId.get(contactId),
              undefined,
              trigger.ruleOverrides,
            ),
            scheduledAt,
            state: 'queued',
          },
        });
        result.tasksEnqueued++;
      }
      continue; // done with this trigger
    }

    // ── Sequence-bound: existing multi-step flow ──────────────────────────
    if (!trigger.sequenceId || !trigger.sequence) {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: sequence bindingKind but no sequenceId`);
      continue;
    }
    if (!trigger.sequence.enabled) {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: sequence disabled`);
      continue;
    }

    const steps = Array.isArray(trigger.sequence.steps)
      ? (trigger.sequence.steps as unknown as SequenceStep[])
      : [];
    if (steps.length === 0) {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: sequence has no steps`);
      continue;
    }

    // 3. Resolve contacts
    const segmentResolution = await resolveSegmentContacts(
      event.orgId,
      trigger.segmentSpec ?? event.segmentHint,
      event.contactId ?? null,
    );
    const contactIds = segmentResolution.contactIds;
    if (contactIds.length === 0) {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: no contacts resolved`);
      continue;
    }

    // 4. Merge runtime rules: sequence defaults + sequence override + trigger override
    const rulesSnapshot = {
      ...DEFAULT_RUNTIME_RULES,
      ...(trigger.sequence.runtimeRules as object),
      ...((trigger.ruleOverrides as object) ?? {}),
    };

    // 5. Find or create active campaign for this trigger + sequence
    // (1 campaign per trigger × sequence; tasks span all contacts under it)
    let campaign = await prisma.automationCampaign.findFirst({
      where: {
        orgId: event.orgId,
        triggerId: trigger.id,
        sequenceId: trigger.sequenceId,
        state: 'active',
      },
      select: { id: true },
    });
    if (!campaign) {
      campaign = await prisma.automationCampaign.create({
        data: {
          id: randomUUID(),
          orgId: event.orgId,
          triggerId: trigger.id,
          executionKind: 'sequence',
          sequenceId: trigger.sequenceId,
          segmentSnapshot: { contactIds } as object,
          rulesSnapshot: rulesSnapshot as object,
          state: 'active',
        },
        select: { id: true },
      });
      result.campaignsCreated++;
    }

    // 6. Load the first step's block to snapshot content
    const firstStep = steps[0];
    const firstBlock = await prisma.block.findFirst({
      where: { id: firstStep.blockId, orgId: event.orgId },
      select: { id: true, content: true, archivedAt: true },
    });
    if (!firstBlock || firstBlock.archivedAt) {
      result.skipped++;
      result.reasons.push(`trigger ${trigger.id}: first block missing or archived`);
      continue;
    }

    // 7. For each contact: idempotent enrollment — skip if already has task for this campaign
    const now = Date.now();
    for (const contactId of contactIds) {
      const existing = await prisma.automationTask.findFirst({
        where: { campaignId: campaign.id, contactId },
        select: { id: true },
      });
      if (existing) {
        result.skipped++;
        result.reasons.push(`contact ${contactId}: already enrolled in campaign ${campaign.id}`);
        continue;
      }

      // Schedule first step. delayMinutes from step + jitter from runtime rule.
      const jitterMin = (rulesSnapshot.randomDelayPerSend?.min ?? 0) * 60 * 1000;
      const jitterMax = (rulesSnapshot.randomDelayPerSend?.max ?? 0) * 60 * 1000;
      const jitter = jitterMin + Math.random() * Math.max(0, jitterMax - jitterMin);
      const scheduledAt = new Date(now + firstStep.delayMinutes * 60 * 1000 + jitter);

      await prisma.automationTask.create({
        data: {
          id: randomUUID(),
          orgId: event.orgId,
          campaignId: campaign.id,
          contactId,
          sequenceId: trigger.sequenceId,
          currentStepIdx: 0,
          currentBlockId: firstBlock.id,
          blockSnapshot: buildTaskBlockSnapshot(
            firstBlock.content,
            segmentResolution.templateProfileByContactId.get(contactId),
            undefined,
            trigger.ruleOverrides,
          ), // SNAPSHOT — frozen content
          scheduledAt,
          state: 'queued',
        },
      });
      result.tasksEnqueued++;
    }
  }

  if (result.tasksEnqueued > 0 || result.campaignsCreated > 0) {
    logger.info('[materializer] event handled', {
      type: event.type,
      campaigns: result.campaignsCreated,
      tasks: result.tasksEnqueued,
      skipped: result.skipped,
    });
  }

  return result;
}
