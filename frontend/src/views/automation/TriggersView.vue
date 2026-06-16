<template>
  <div class="triggers-view">
    <header class="at-page-header">
      <div>
        <h1 class="at-page-title">Kịch bản</h1>
        <p class="at-page-subtitle">
          Khi event xảy ra → engine tự động khởi động sequence/block bạn đã cấu hình.
          Trigger là điểm vào — sequence/block là việc cần làm.
        </p>
      </div>
      <div class="header-actions">
        <button class="at-btn at-btn--ghost" :class="{ 'is-active': tab === 'configured' }" @click="tab = 'configured'">
          Đã cấu hình
          <span v-if="configured.length > 0" class="at-chip">{{ configured.length }}</span>
        </button>
        <button class="at-btn at-btn--ghost" :class="{ 'is-active': tab === 'catalog' }" @click="tab = 'catalog'">
          Catalog
        </button>
      </div>
    </header>

    <!-- ─── CATALOG TAB ─── -->
    <div v-if="tab === 'catalog'">
      <div class="catalog-toolbar">
        <div class="catalog-search">
          <v-icon size="18" color="rgba(0,0,0,0.4)">mdi-magnify</v-icon>
          <input
            v-model="catalogSearch"
            class="catalog-search__input"
            placeholder="Tìm trigger theo tên hoặc mô tả..."
          />
        </div>
        <div class="catalog-filter">
          <button
            class="filter-chip"
            :class="{ 'is-active': categoryFilter === 'all' }"
            @click="categoryFilter = 'all'"
          >
            Tất cả
          </button>
          <button
            v-for="cat in availableCategories"
            :key="cat.key"
            class="filter-chip"
            :class="{ 'is-active': categoryFilter === cat.key }"
            @click="categoryFilter = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <div v-for="group in groupedCatalog" :key="group.category" class="catalog-group">
        <div class="catalog-group__head">
          <span class="catalog-group__label">{{ CATEGORY_COLOR[group.category].label }}</span>
          <span class="catalog-group__count">{{ group.items.length }}</span>
        </div>

        <div class="catalog-grid">
          <article
            v-for="entry in group.items"
            :key="entry.eventType"
            class="catalog-card"
            :style="{
              '--card-accent': CATEGORY_COLOR[entry.category].bg,
              '--card-tint': CATEGORY_COLOR[entry.category].tint,
              '--card-text': CATEGORY_COLOR[entry.category].text,
            }"
          >
            <div class="catalog-card__head">
              <div class="catalog-card__icon">
                <v-icon size="20">{{ iconForEvent(entry.eventType) }}</v-icon>
              </div>
              <span class="catalog-card__binding">
                {{ bindingLabel(entry.recommendedBinding) }}
              </span>
            </div>
            <h3 class="catalog-card__title">{{ entry.title }}</h3>
            <p class="catalog-card__desc">{{ entry.description }}</p>
            <button class="at-btn at-btn--primary at-btn--sm" @click="openCreateFromCatalog(entry)">
              Khởi tạo
            </button>
          </article>
        </div>
      </div>

      <div v-if="groupedCatalog.length === 0" class="at-empty">
        <v-icon size="40">mdi-magnify-close</v-icon>
        <div class="at-empty__title">Không tìm thấy trigger</div>
        <p class="at-empty__desc">Đổi từ khoá tìm hoặc xoá filter để xem toàn bộ catalog.</p>
      </div>
    </div>

    <!-- ─── CONFIGURED TAB ─── -->
    <div v-else>
      <div v-if="loading" class="at-empty">
        <v-progress-circular indeterminate size="28" color="primary" />
      </div>

      <div v-else-if="configured.length === 0" class="at-empty">
        <v-icon size="48">mdi-lightning-bolt-outline</v-icon>
        <div class="at-empty__title">Chưa có trigger nào</div>
        <p class="at-empty__desc">
          Vào Catalog để chọn 1 trong {{ catalog.length }} trigger mẫu, hoặc tạo manual.
        </p>
        <button class="at-btn at-btn--primary" @click="tab = 'catalog'">Xem catalog</button>
      </div>

      <div v-else class="configured-table">
        <div class="configured-row configured-row--head">
          <div>Trigger</div>
          <div>Event</div>
          <div>Bind tới</div>
          <div class="cell-center">Bật</div>
          <div class="cell-right">Thao tác</div>
        </div>
        <div
          v-for="trig in configured"
          :key="trig.id"
          class="configured-row"
        >
          <div class="cell-trig">
            <div
              class="trig-avatar"
              :style="{ background: CATEGORY_COLOR[trig.category].tint, color: CATEGORY_COLOR[trig.category].text }"
            >
              <v-icon size="18">{{ iconForEvent(trig.eventType) }}</v-icon>
            </div>
            <div>
              <div class="trig-name">{{ trig.name }}</div>
              <div class="trig-meta">{{ CATEGORY_COLOR[trig.category].label }}</div>
            </div>
          </div>
          <div>
            <span class="at-chip">{{ trig.eventType }}</span>
          </div>
          <div>
            <span v-if="trig.sequence" class="binding-link">→ {{ trig.sequence.name }}</span>
            <span v-else-if="trig.broadcast" class="binding-link">→ {{ trig.broadcast.name }}</span>
            <span v-else-if="trig.blockId" class="binding-link">→ Block</span>
            <span v-else class="binding-link binding-link--error">⚠ Chưa bind</span>
          </div>
          <div class="cell-center">
            <v-switch
              :model-value="trig.enabled"
              hide-details inline density="compact" color="success"
              @update:model-value="toggleTrigger(trig)"
            />
          </div>
          <div class="cell-right cell-actions">
            <button class="at-btn at-btn--ghost at-btn--xs" @click="openEdit(trig)" title="Sửa">
              <v-icon size="16">mdi-pencil-outline</v-icon>
            </button>
            <button
              class="at-btn at-btn--ghost at-btn--xs"
              :disabled="!trig.enabled"
              @click="onManualRun(trig)"
              title="Chạy thủ công"
            >
              <v-icon size="16">mdi-play-circle-outline</v-icon>
            </button>
            <button class="at-btn at-btn--ghost at-btn--xs" @click="onDelete(trig)" title="Xoá" style="color: var(--at-coral);">
              <v-icon size="16">mdi-delete-outline</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor dialog (Vuetify wrapped, but body uses airtable classes) -->
    <v-dialog v-model="editorOpen" max-width="640" persistent>
      <div v-if="draft" class="airtable-scope editor-card">
        <div class="editor-card__head">
          <div
            class="trig-avatar"
            :style="{ background: CATEGORY_COLOR[draft.category].tint, color: CATEGORY_COLOR[draft.category].text }"
          >
            <v-icon size="22">{{ iconForEvent(draft.eventType) }}</v-icon>
          </div>
          <div>
            <div class="at-title-sm">{{ draft.id ? 'Sửa Trigger' : 'Tạo Trigger' }}</div>
            <div class="at-caption">{{ draft.eventType }}</div>
          </div>
          <button class="editor-card__close" @click="editorOpen = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </div>
        <hr class="at-hairline" />
        <div class="editor-card__body">
          <div class="form-field">
            <label class="form-label">Tên</label>
            <input v-model="draft.name" class="at-input" placeholder="Ví dụ: KH đồng ý kết bạn → gửi welcome" />
          </div>

          <div class="form-field">
            <label class="form-label">Event type</label>
            <select v-model="draft.eventType" class="at-input">
              <option v-for="opt in eventTypeItems" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
            </select>
          </div>

          <div class="form-field">
            <label class="form-label">Bind tới gì khi event fire</label>
            <select v-model="draft.bindingKind" class="at-input">
              <option value="sequence">Sequence (multi-step flow)</option>
              <option value="block">Block (1 action)</option>
              <option value="broadcast" disabled>Broadcast (Phase F)</option>
            </select>
          </div>

          <div v-if="draft.bindingKind === 'sequence'" class="form-field">
            <label class="form-label">Sequence sẽ chạy</label>
            <select v-model="draft.sequenceId" class="at-input">
              <option :value="null">— Chọn sequence —</option>
              <option v-for="s in sequenceOptions" :key="s.value" :value="s.value">{{ s.title }}</option>
            </select>
            <p v-if="sequenceOptions.length === 0" class="at-caption form-hint">
              Chưa có sequence enabled. Tạo ở tab Kịch bản chăm sóc trước.
            </p>
          </div>
          <div v-if="draft.bindingKind === 'block'" class="form-field">
            <label class="form-label">Block sẽ chạy</label>
            <select v-model="draft.blockId" class="at-input">
              <option :value="null">— Chọn block —</option>
              <option v-for="b in blockOptions" :key="b.value" :value="b.value">{{ b.title }}</option>
            </select>
          </div>

          <div v-if="draft.bindingKind === 'block'" class="form-field">
            <label class="form-label">Chống trùng trong block campaign</label>
            <label class="form-toggle">
              <input type="checkbox" v-model="triggerDedupBlockCampaign" />
              <span>Bật kiểm tra "already in block campaign" (mặc định bật)</span>
            </label>
          </div>

          <div v-if="showSendMessageTargetsConfig" class="form-field trigger-targets">
            <label class="form-label">Người nhận tin nhắn</label>
            <p class="at-caption form-hint">
              Cấu hình ở trigger để cùng một block nội dung có thể gửi đến group/contact khác nhau theo từng kịch bản.
            </p>

            <label class="form-toggle">
              <input type="checkbox" v-model="triggerGroupTargetsEnabled" />
              <span>Gửi vào group</span>
            </label>
            <template v-if="triggerGroupTargetsEnabled">
              <div v-for="(target, idx) in triggerGroupTargets" :key="`trigger-group-${idx}`" class="trigger-target-row">
                <select v-model="target.accountId" class="at-input" @change="onTriggerGroupAccountChanged(idx)">
                  <option value="">— Nick gửi —</option>
                  <option v-for="account in triggerAccountItems" :key="account.value" :value="account.value">{{ account.title }}</option>
                </select>
                <select v-model="target.groupId" class="at-input" @change="onTriggerGroupSelected(idx)">
                  <option value="">— Group nhận —</option>
                  <option v-for="group in triggerGroupItemsForAccount(target.accountId)" :key="`${group.accountId}:${group.value}`" :value="group.value">{{ group.title }}</option>
                </select>
                <button type="button" class="at-btn at-btn--ghost at-btn--xs trigger-target-row__remove" @click="removeTriggerGroupTarget(idx)">
                  <v-icon size="16">mdi-close</v-icon>
                </button>
              </div>
              <button type="button" class="at-btn at-btn--ghost at-btn--sm" @click="addTriggerGroupTarget">
                <v-icon size="15">mdi-plus</v-icon>
                Thêm group
              </button>
            </template>

            <label class="form-toggle trigger-targets__toggle">
              <input type="checkbox" v-model="triggerUserTargetsEnabled" />
              <span>Gửi cho cá nhân</span>
            </label>
            <template v-if="triggerUserTargetsEnabled">
              <div v-for="(target, idx) in triggerUserTargets" :key="`trigger-user-${idx}`" class="trigger-target-row">
                <select v-model="target.accountId" class="at-input">
                  <option value="">— Nick gửi —</option>
                  <option v-for="account in triggerAccountItems" :key="account.value" :value="account.value">{{ account.title }}</option>
                </select>
                <select v-model="target.contactId" class="at-input">
                  <option value="">— Contact nhận —</option>
                  <option v-for="contact in triggerUserContactItems" :key="contact.value" :value="contact.value">{{ contact.title }}</option>
                </select>
                <button type="button" class="at-btn at-btn--ghost at-btn--xs trigger-target-row__remove" @click="removeTriggerUserTarget(idx)">
                  <v-icon size="16">mdi-close</v-icon>
                </button>
              </div>
              <button type="button" class="at-btn at-btn--ghost at-btn--sm" @click="addTriggerUserTarget">
                <v-icon size="15">mdi-plus</v-icon>
                Thêm contact
              </button>
            </template>
          </div>

          <!-- Cron expression field — only for scheduled_cron event type -->
          <div v-if="draft.eventType === 'scheduled_cron'" class="form-field">
            <label class="form-label">Cron expression (TZ Asia/Ho_Chi_Minh)</label>
            <input v-model="draft.cronExpr" class="at-input" placeholder="0 9 * * 1   (9h sáng thứ 2 hàng tuần)" />
            <p class="at-caption form-hint">
              Format: <code>phút giờ ngày tháng thứ</code>. Ví dụ:
              <code>0 9 * * 1</code> = 9h sáng T2,
              <code>0 8 1 * *</code> = 8h sáng ngày 1 mỗi tháng,
              <code>0 */2 * * *</code> = mỗi 2 tiếng.
            </p>
            <div class="cron-presets">
              <button type="button" class="filter-chip" @click="draft.cronExpr = '0 9 * * 1'">T2 9h</button>
              <button type="button" class="filter-chip" @click="draft.cronExpr = '0 8 1 * *'">Ngày 1 mỗi tháng 8h</button>
              <button type="button" class="filter-chip" @click="draft.cronExpr = '0 9 * * *'">Daily 9h</button>
              <button type="button" class="filter-chip" @click="draft.cronExpr = '0 18 * * 5'">T6 18h</button>
            </div>
          </div>

          <div v-if="draft.eventType === 'scheduled_cron'" class="form-field">
            <label class="form-label">Gửi thêm nội dung qua Telegram</label>
            <select v-model="triggerTelegramIntegrationId" class="at-input">
              <option value="">Không gửi qua Telegram</option>
              <option v-for="item in telegramIntegrationItems" :key="item.value" :value="item.value">
                {{ item.title }}
              </option>
            </select>
            <p class="at-caption form-hint">
              Khi block gửi tin qua Zalo, hệ thống cũng gửi cùng text/ảnh đã render sang Telegram Bot đã chọn.
            </p>
          </div>

          <div v-if="['scheduled_cron', 'birthday'].includes(draft.eventType)" class="form-field">
            <label class="form-label">Audience theo tệp người dùng (optional)</label>
            <select v-model="segmentKind" class="at-input">
              <option value="none">Không dùng customer-list</option>
              <option value="customer-list">Dùng customer-list</option>
            </select>
            <template v-if="segmentKind === 'customer-list'">
              <select v-model="segmentCustomerListId" class="at-input">
                <option value="">— Chọn tệp người dùng —</option>
                <option v-for="list in customerListOptions" :key="list.id" :value="list.id">
                  {{ list.iconEmoji ? `${list.iconEmoji} ` : '' }}{{ list.name }}
                  ({{ list.validEntries }}/{{ list.totalEntries }} hợp lệ)
                </option>
              </select>
              <p v-if="customerListOptions.length === 0" class="at-caption form-hint">
                Chưa có tệp người dùng active. Tạo tệp ở mục Tệp người dùng trước.
              </p>
              <label class="form-toggle">
                <input type="checkbox" v-model="segmentBirthdayThisWeek" />
                <span>Chỉ lấy người có sinh nhật trong tuần hiện tại</span>
              </label>
              <label class="form-toggle">
                <input type="checkbox" v-model="segmentBirthdayToday" />
                <span>Chỉ lấy người có sinh nhật trong ngày hôm nay từ tệp người dùng</span>
              </label>
            </template>
          </div>

          <label class="form-toggle">
            <input type="checkbox" v-model="draft.enabled" />
            <span>Bật trigger ngay sau khi lưu</span>
          </label>

          <div v-if="error" class="form-error">{{ error }}</div>
        </div>
        <hr class="at-hairline" />
        <div class="editor-card__foot">
          <button class="at-btn at-btn--secondary" @click="editorOpen = false">Huỷ</button>
          <button class="at-btn at-btn--primary" :disabled="saving" @click="saveTrigger">
            {{ saving ? 'Đang lưu...' : 'Lưu' }}
          </button>
        </div>
      </div>
    </v-dialog>

    <v-snackbar v-model="toastOpen" :color="toastColor" timeout="3000" location="bottom right">
      {{ toastMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '@/api/index';
import { triggersApi, sequencesApi, blocksApi } from '@/api/automation';
import type {
  AutomationTrigger, TriggerCatalogEntry, AutomationSequence, Block,
  TriggerEventType, TriggerBindingKind, TriggerCategory,
} from '@/api/automation/types';
import { CATEGORY_COLOR, iconForEvent } from '@/components/automation/phase7/design-tokens';
import { useZaloAccounts } from '@/composables/use-zalo-accounts';
import { useContacts, type Contact } from '@/composables/use-contacts';

const tab = ref<'configured' | 'catalog'>('configured');
const catalog = ref<TriggerCatalogEntry[]>([]);
const configured = ref<AutomationTrigger[]>([]);
const sequences = ref<AutomationSequence[]>([]);
const blocks = ref<Block[]>([]);
const customerListOptions = ref<Array<{
  id: string;
  name: string;
  iconEmoji: string | null;
  totalEntries: number;
  validEntries: number;
}>>([]);
const integrations = ref<Array<{
  id: string;
  type: string;
  name: string;
  enabled: boolean;
}>>([]);
const {
  accounts: zaloAccounts,
  fetchAccounts,
} = useZaloAccounts();
const {
  contacts: groupContacts,
  filters: groupContactFilters,
  pagination: groupContactPagination,
  fetchContacts: fetchGroupContacts,
} = useContacts();
const {
  contacts: userContacts,
  filters: userContactFilters,
  pagination: userContactPagination,
  fetchContacts: fetchUserContacts,
} = useContacts();
groupContactFilters.threadType = 'group';
groupContactPagination.limit = 100;
userContactFilters.threadType = 'user';
userContactPagination.limit = 100;
const loading = ref(true);

const catalogSearch = ref('');
const categoryFilter = ref<'all' | TriggerCategory>('all');

const editorOpen = ref(false);
const saving = ref(false);
const error = ref('');

const toastOpen = ref(false);
const toastMsg = ref('');
const toastColor = ref<'success' | 'error' | 'info'>('info');

interface Draft {
  id: string | null;
  name: string;
  eventType: TriggerEventType;
  category: TriggerCategory;
  bindingKind: TriggerBindingKind;
  sequenceId: string | null;
  blockId: string | null;
  broadcastId: string | null;
  enabled: boolean;
  cronExpr: string; // packed into eventFilter.cron when eventType=scheduled_cron
}
const draft = ref<Draft | null>(null);
const segmentKind = ref<'none' | 'customer-list'>('none');
const segmentCustomerListId = ref('');
const segmentBirthdayThisWeek = ref(false);
const segmentBirthdayToday = ref(false);
const triggerGroupTargetsEnabled = ref(false);
const triggerUserTargetsEnabled = ref(false);
const triggerGroupTargets = ref<Array<{ accountId: string; groupId: string }>>([{ accountId: '', groupId: '' }]);
const triggerUserTargets = ref<Array<{ accountId: string; contactId: string }>>([{ accountId: '', contactId: '' }]);
const triggerTelegramIntegrationId = ref('');
const triggerRuleOverridesBase = ref<Record<string, unknown>>({});
const triggerDedupBlockCampaign = ref(true);

const availableCategories = computed(() => {
  const present = new Set(catalog.value.map((c) => c.category));
  return Array.from(present).map((key) => ({ key, label: CATEGORY_COLOR[key].label }));
});

const filteredCatalog = computed(() => {
  const q = catalogSearch.value?.trim().toLowerCase() ?? '';
  return catalog.value.filter((c) => {
    if (categoryFilter.value !== 'all' && c.category !== categoryFilter.value) return false;
    if (!q) return true;
    return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });
});

const groupedCatalog = computed(() => {
  const map = new Map<TriggerCategory, TriggerCatalogEntry[]>();
  for (const e of filteredCatalog.value) {
    if (!map.has(e.category)) map.set(e.category, []);
    map.get(e.category)!.push(e);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
});

const eventTypeItems = computed(() =>
  catalog.value.map((c) => ({ value: c.eventType, title: `${c.title} (${c.eventType})` })),
);

const sequenceOptions = computed(() =>
  sequences.value.filter((s) => s.enabled).map((s) => ({ value: s.id, title: s.name })),
);
const blockOptions = computed(() =>
  blocks.value.filter((b) => !b.archivedAt).map((b) => ({ value: b.id, title: b.name })),
);

watch(segmentBirthdayToday, (enabled) => {
  if (enabled) segmentBirthdayThisWeek.value = false;
});

watch(segmentBirthdayThisWeek, (enabled) => {
  if (enabled) segmentBirthdayToday.value = false;
});
const draftBlock = computed(() => {
  if (!draft.value?.blockId) return null;
  return blocks.value.find((b) => b.id === draft.value?.blockId) ?? null;
});
const showSendMessageTargetsConfig = computed(() => (
  draft.value?.bindingKind === 'block'
  && draftBlock.value?.actionType === 'send_message'
));
const triggerAccountItems = computed(() => {
  const items = zaloAccounts.value.map((account) => ({
    title: account.displayName || account.phone || account.zaloUid || account.id,
    value: account.id,
  }));
  const selectedIds = [
    ...triggerGroupTargets.value.map((target) => target.accountId),
    ...triggerUserTargets.value.map((target) => target.accountId),
  ].filter(Boolean);
  for (const id of selectedIds) {
    if (!items.some((item) => item.value === id)) items.push({ title: id, value: id });
  }
  return items;
});
const triggerUserContactItems = computed(() => {
  const items = userContacts.value.map((contact) => ({
    title: contact.fullName || contact.crmName || contact.phone || contact.id,
    value: contact.id,
  }));
  for (const id of triggerUserTargets.value.map((target) => target.contactId).filter(Boolean)) {
    if (!items.some((item) => item.value === id)) items.push({ title: id, value: id });
  }
  return items;
});
const telegramIntegrationItems = computed(() => {
  const items = integrations.value
    .filter((integration) => integration.type === 'telegram' && integration.enabled)
    .map((integration) => ({
      title: integration.name || integration.id,
      value: integration.id,
    }));
  if (
    triggerTelegramIntegrationId.value
    && !items.some((item) => item.value === triggerTelegramIntegrationId.value)
  ) {
    items.push({ title: `${triggerTelegramIntegrationId.value} (đã lưu)`, value: triggerTelegramIntegrationId.value });
  }
  return items;
});

function bindingLabel(b: TriggerBindingKind): string {
  return { sequence: 'Sequence', block: 'Block', broadcast: 'Broadcast' }[b];
}

async function loadAll() {
  loading.value = true;
  try {
    const [cat, conf, seqs, blks, listsRes, integrationsRes] = await Promise.all([
      triggersApi.listTriggerCatalog(),
      triggersApi.listTriggers(),
      sequencesApi.listSequences(),
      blocksApi.listBlocks({ limit: 500 }),
      api.get('/customer-lists', { params: { status: 'active', limit: 100 } }),
      api.get('/integrations'),
      fetchAccounts(),
      fetchGroupContacts(),
      fetchUserContacts(),
    ]);
    catalog.value = cat;
    configured.value = conf;
    sequences.value = seqs;
    blocks.value = blks;
    customerListOptions.value = listsRes.data?.lists ?? [];
    integrations.value = Array.isArray(integrationsRes.data) ? integrationsRes.data : [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);

function openCreateFromCatalog(entry: TriggerCatalogEntry) {
  draft.value = {
    id: null,
    name: entry.title,
    eventType: entry.eventType,
    category: entry.category,
    bindingKind: entry.recommendedBinding === 'broadcast' ? 'sequence' : entry.recommendedBinding,
    sequenceId: null,
    blockId: null,
    broadcastId: null,
    enabled: false,
    cronExpr: entry.eventType === 'scheduled_cron' ? '0 9 * * 1' : '',
  };
  error.value = '';
  segmentKind.value = 'none';
  segmentCustomerListId.value = '';
  segmentBirthdayThisWeek.value = false;
  segmentBirthdayToday.value = false;
  triggerRuleOverridesBase.value = {};
  triggerDedupBlockCampaign.value = true;
  triggerTelegramIntegrationId.value = '';
  resetTriggerTargets();
  editorOpen.value = true;
}

function openEdit(trig: AutomationTrigger) {
  draft.value = {
    id: trig.id,
    name: trig.name,
    eventType: trig.eventType,
    category: trig.category,
    bindingKind: trig.bindingKind,
    sequenceId: trig.sequenceId,
    blockId: trig.blockId,
    broadcastId: trig.broadcastId,
    enabled: trig.enabled,
    cronExpr: extractCronFromFilter(trig.eventFilter),
  };
  const seg = trig.segmentSpec as Record<string, unknown> | null;
  if (seg?.kind === 'customer-list' && typeof seg.listId === 'string') {
    segmentKind.value = 'customer-list';
    segmentCustomerListId.value = seg.listId;
    segmentBirthdayThisWeek.value = seg.birthdayThisWeek === true;
    segmentBirthdayToday.value = seg.birthdayToday === true;
  } else {
    segmentKind.value = 'none';
    segmentCustomerListId.value = '';
    segmentBirthdayThisWeek.value = false;
    segmentBirthdayToday.value = false;
  }
  if (
    trig.ruleOverrides
    && typeof trig.ruleOverrides === 'object'
    && !Array.isArray(trig.ruleOverrides)
    && typeof (trig.ruleOverrides as Record<string, unknown>).dedupBlockCampaign === 'boolean'
  ) {
    triggerDedupBlockCampaign.value = Boolean((trig.ruleOverrides as Record<string, unknown>).dedupBlockCampaign);
  } else {
    triggerDedupBlockCampaign.value = true;
  }
  readTriggerTargetsFromRuleOverrides(trig.ruleOverrides);
  readTelegramNotificationFromRuleOverrides(trig.ruleOverrides);
  error.value = '';
  editorOpen.value = true;
}

function extractCronFromFilter(filter: Record<string, unknown> | null): string {
  if (!filter || typeof filter !== 'object') return '';
  const c = (filter as Record<string, unknown>).cron;
  return typeof c === 'string' ? c : '';
}

function groupOptionsFromContact(contact: Contact, accountNames: Map<string, string>) {
  return (contact.conversations ?? [])
    .filter((conversation) => conversation.threadType === 'group' && conversation.externalThreadId)
    .map((conversation) => {
      const accountName = accountNames.get(conversation.zaloAccountId) || conversation.zaloAccountId;
      const groupName = conversation.groupName || contact.fullName || contact.crmName || conversation.externalThreadId || contact.id;
      return {
        title: `${groupName} · ${accountName}`,
        value: conversation.externalThreadId!,
        accountId: conversation.zaloAccountId,
      };
    });
}

function triggerGroupItemsForAccount(accountId: string) {
  const accountNames = new Map(zaloAccounts.value.map((account) => [
    account.id,
    account.displayName || account.phone || account.zaloUid || account.id,
  ]));
  const items = groupContacts.value.flatMap((contact) => groupOptionsFromContact(contact, accountNames));
  return accountId ? items.filter((item) => item.accountId === accountId) : items;
}

function onTriggerGroupAccountChanged(idx: number) {
  const target = triggerGroupTargets.value[idx];
  if (!target?.accountId || !target.groupId) return;
  const valid = triggerGroupItemsForAccount(target.accountId).some((item) => item.value === target.groupId);
  if (!valid) target.groupId = '';
}

function onTriggerGroupSelected(idx: number) {
  const target = triggerGroupTargets.value[idx];
  if (!target || target.accountId || !target.groupId) return;
  const selected = triggerGroupItemsForAccount('').find((item) => item.value === target.groupId);
  if (selected?.accountId) target.accountId = selected.accountId;
}

function addTriggerGroupTarget() {
  triggerGroupTargets.value.push({ accountId: '', groupId: '' });
}

function removeTriggerGroupTarget(idx: number) {
  if (triggerGroupTargets.value.length <= 1) {
    triggerGroupTargets.value = [{ accountId: '', groupId: '' }];
    return;
  }
  triggerGroupTargets.value.splice(idx, 1);
}

function addTriggerUserTarget() {
  triggerUserTargets.value.push({ accountId: '', contactId: '' });
}

function removeTriggerUserTarget(idx: number) {
  if (triggerUserTargets.value.length <= 1) {
    triggerUserTargets.value = [{ accountId: '', contactId: '' }];
    return;
  }
  triggerUserTargets.value.splice(idx, 1);
}

function resetTriggerTargets() {
  triggerGroupTargetsEnabled.value = false;
  triggerUserTargetsEnabled.value = false;
  triggerGroupTargets.value = [{ accountId: '', groupId: '' }];
  triggerUserTargets.value = [{ accountId: '', contactId: '' }];
}

function readTriggerTargetsFromRuleOverrides(ruleOverrides: Record<string, unknown> | null) {
  const base = ruleOverrides && typeof ruleOverrides === 'object' ? { ...ruleOverrides } : {};
  const targets = base.sendMessageTargets;
  delete base.sendMessageTargets;
  delete base.telegramMessageTarget;
  delete base.telegramNotification;
  triggerRuleOverridesBase.value = base;
  const groupTargets = readGroupTargets(targets);
  const userTargets = readUserTargets(targets);
  triggerGroupTargets.value = groupTargets.length > 0 ? groupTargets : [{ accountId: '', groupId: '' }];
  triggerUserTargets.value = userTargets.length > 0 ? userTargets : [{ accountId: '', contactId: '' }];
  triggerGroupTargetsEnabled.value = groupTargets.length > 0;
  triggerUserTargetsEnabled.value = userTargets.length > 0;
}

function readTelegramNotificationFromRuleOverrides(ruleOverrides: Record<string, unknown> | null) {
  if (!ruleOverrides || typeof ruleOverrides !== 'object') {
    triggerTelegramIntegrationId.value = '';
    return;
  }
  const target = ruleOverrides.telegramMessageTarget ?? ruleOverrides.telegramNotification;
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    triggerTelegramIntegrationId.value = '';
    return;
  }
  const integrationId = (target as Record<string, unknown>).integrationId;
  triggerTelegramIntegrationId.value = typeof integrationId === 'string' ? integrationId : '';
}

function buildRuleOverridesPayload() {
  const out: Record<string, unknown> = { ...triggerRuleOverridesBase.value };
  if (draft.value?.bindingKind === 'block') out.dedupBlockCampaign = triggerDedupBlockCampaign.value;
  else delete out.dedupBlockCampaign;
  if (draft.value?.eventType === 'scheduled_cron' && triggerTelegramIntegrationId.value.trim()) {
    out.telegramMessageTarget = { integrationId: triggerTelegramIntegrationId.value.trim() };
  } else {
    delete out.telegramMessageTarget;
  }
  if (!showSendMessageTargetsConfig.value) {
    delete out.sendMessageTargets;
    return out;
  }
  const groupTargets = triggerGroupTargetsEnabled.value
    ? triggerGroupTargets.value
      .filter((target) => target.accountId.trim() && target.groupId.trim())
      .map((target) => ({ accountId: target.accountId.trim(), groupId: target.groupId.trim() }))
    : [];
  const userTargets = triggerUserTargetsEnabled.value
    ? triggerUserTargets.value
      .filter((target) => target.accountId.trim() && target.contactId.trim())
      .map((target) => ({ accountId: target.accountId.trim(), contactId: target.contactId.trim() }))
    : [];
  if (groupTargets.length > 0 || userTargets.length > 0) {
    out.sendMessageTargets = {
      ...(groupTargets.length > 0 ? { groupTargets } : {}),
      ...(userTargets.length > 0 ? { userTargets } : {}),
    };
  } else {
    delete out.sendMessageTargets;
  }
  return out;
}

function readGroupTargets(targets: unknown) {
  if (!targets || typeof targets !== 'object' || Array.isArray(targets)) return [];
  const rows = (targets as Record<string, unknown>).groupTargets;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => item as { accountId?: unknown; groupId?: unknown })
    .filter((item) => typeof item.accountId === 'string' && item.accountId.trim() && typeof item.groupId === 'string' && item.groupId.trim())
    .map((item) => ({ accountId: String(item.accountId).trim(), groupId: String(item.groupId).trim() }));
}

function readUserTargets(targets: unknown) {
  if (!targets || typeof targets !== 'object' || Array.isArray(targets)) return [];
  const rows = (targets as Record<string, unknown>).userTargets;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => item as { accountId?: unknown; contactId?: unknown })
    .filter((item) => typeof item.accountId === 'string' && item.accountId.trim() && typeof item.contactId === 'string' && item.contactId.trim())
    .map((item) => ({ accountId: String(item.accountId).trim(), contactId: String(item.contactId).trim() }));
}

function showToast(msg: string, color: 'success' | 'error' | 'info' = 'info') {
  toastMsg.value = msg; toastColor.value = color; toastOpen.value = true;
}

async function saveTrigger() {
  if (!draft.value) return;
  error.value = '';
  if (!draft.value.name.trim()) { error.value = 'Tên không được rỗng'; return; }

  // For scheduled_cron, cron expression is mandatory
  if (draft.value.eventType === 'scheduled_cron' && !draft.value.cronExpr.trim()) {
    error.value = 'Cron expression không được rỗng cho scheduled_cron';
    return;
  }

  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      name: draft.value.name.trim(),
      eventType: draft.value.eventType,
      bindingKind: draft.value.bindingKind,
      sequenceId: draft.value.bindingKind === 'sequence' ? draft.value.sequenceId : null,
      blockId: draft.value.bindingKind === 'block' ? draft.value.blockId : null,
      broadcastId: draft.value.bindingKind === 'broadcast' ? draft.value.broadcastId : null,
      enabled: draft.value.enabled,
    };
    // Pack cron into eventFilter (backend cron-event-scheduler reads from here)
    if (draft.value.eventType === 'scheduled_cron' || draft.value.eventType === 'birthday') {
      if (draft.value.eventType === 'scheduled_cron') {
        payload.eventFilter = { cron: draft.value.cronExpr.trim() };
      }
      if (segmentKind.value === 'customer-list') {
        if (!segmentCustomerListId.value.trim()) {
          error.value = 'Cần CustomerList ID khi dùng customer-list';
          saving.value = false;
          return;
        }
        payload.segmentSpec = {
          kind: 'customer-list',
          listId: segmentCustomerListId.value.trim(),
          ...(segmentBirthdayToday.value ? { birthdayToday: true } : {}),
          ...(!segmentBirthdayToday.value && segmentBirthdayThisWeek.value ? { birthdayThisWeek: true } : {}),
        };
      } else {
        payload.segmentSpec = null;
      }
    }
    const ruleOverrides = buildRuleOverridesPayload();
    payload.ruleOverrides = Object.keys(ruleOverrides).length > 0 ? ruleOverrides : null;
    if (draft.value.id) await triggersApi.updateTrigger(draft.value.id, payload as any);
    else                await triggersApi.createTrigger(payload as any);
    editorOpen.value = false;
    tab.value = 'configured';
    await loadAll();
    showToast('Đã lưu', 'success');
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Lỗi';
  } finally {
    saving.value = false;
  }
}

async function toggleTrigger(trig: AutomationTrigger) {
  try {
    if (trig.enabled) await triggersApi.disableTrigger(trig.id);
    else              await triggersApi.enableTrigger(trig.id);
    await loadAll();
  } catch (err: any) {
    showToast(err?.response?.data?.error ?? 'Lỗi toggle', 'error');
  }
}

async function onManualRun(trig: AutomationTrigger) {
  const canRunWithoutContact = hasDirectBlockTarget(trig) || (trig.eventType !== 'scheduled_cron' && hasConfiguredAudience(trig));
  let contactId = '';
  if (!canRunWithoutContact) {
    const input = prompt(`Chạy "${trig.name}" cho contactId nào?`);
    if (input === null) return;
    contactId = input.trim();
  }
  try {
    const result = await triggersApi.runTrigger(trig.id, contactId ? { contactId } : {});
    if (result.mode === 'direct_block_test' && result.outcome && result.outcome !== 'success') {
      showToast(result.errorMessage || result.errorCode || 'Test block thất bại', 'error');
      return;
    }
    if (result.mode === 'materialized') {
      const tasks = result.materializeResult?.tasksEnqueued ?? 0;
      const noopSuccesses = result.materializeResult?.noopSuccesses ?? 0;
      showToast(
        tasks > 0
          ? `Đã tạo ${tasks} task để worker xử lý.`
          : noopSuccesses > 0
            ? 'Trigger đã chạy, không có người nào thỏa điều kiện.'
            : 'Không tạo được task mới.',
        tasks > 0 || noopSuccesses > 0 ? 'success' : 'error',
      );
      return;
    }
    showToast(
      result.mode === 'direct_block_test'
        ? 'Đã chạy test block trực tiếp.'
        : 'Event đã emit. Worker sẽ pick task trong ~10s.',
      'success',
    );
  } catch (err: any) {
    const data = err?.response?.data;
    const reasons = Array.isArray(data?.materializeResult?.reasons)
      ? data.materializeResult.reasons.filter(Boolean).join('; ')
      : '';
    showToast(reasons || data?.error || err?.message, 'error');
  }
}

function triggerBlock(trig: AutomationTrigger): Block | null {
  if (!trig.blockId) return null;
  return blocks.value.find((b) => b.id === trig.blockId) ?? null;
}

function hasDirectBlockTarget(trig: AutomationTrigger): boolean {
  const block = triggerBlock(trig);
  if (!block || block.actionType !== 'send_message') return false;
  const triggerTargets = trig.ruleOverrides?.sendMessageTargets;
  if (readGroupTargets(triggerTargets).length > 0 || readUserTargets(triggerTargets).length > 0) return true;
  const groupTarget = block.content?.groupTarget as { accountId?: unknown; groupId?: unknown } | undefined;
  const groupTargets = block.content?.groupTargets as Array<{ accountId?: unknown; groupId?: unknown }> | undefined;
  const userTargets = block.content?.userTargets as Array<{ accountId?: unknown; contactId?: unknown }> | undefined;
  const hasLegacyGroupTarget = (
    typeof groupTarget?.accountId === 'string'
    && groupTarget.accountId.trim().length > 0
    && typeof groupTarget.groupId === 'string'
    && groupTarget.groupId.trim().length > 0
  );
  const hasGroupTargets = Array.isArray(groupTargets) && groupTargets.some((target) => (
    typeof target.accountId === 'string'
    && target.accountId.trim().length > 0
    && typeof target.groupId === 'string'
    && target.groupId.trim().length > 0
  ));
  const hasUserTargets = Array.isArray(userTargets) && userTargets.some((target) => (
    typeof target.accountId === 'string'
    && target.accountId.trim().length > 0
    && typeof target.contactId === 'string'
    && target.contactId.trim().length > 0
  ));
  return hasLegacyGroupTarget || hasGroupTargets || hasUserTargets;
}

function hasConfiguredAudience(trig: AutomationTrigger): boolean {
  return Boolean(trig.segmentSpec && typeof trig.segmentSpec === 'object');
}

async function onDelete(trig: AutomationTrigger) {
  if (!confirm(`Xoá trigger "${trig.name}"?`)) return;
  try {
    await triggersApi.deleteTrigger(trig.id);
    await loadAll();
    showToast('Đã xoá', 'success');
  } catch (err: any) {
    showToast(err?.response?.data?.detail || err?.response?.data?.error || 'Không xoá được', 'error');
  }
}
</script>

<style scoped>
.triggers-view { max-width: 1280px; }

.header-actions {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--at-surface-soft);
  border-radius: var(--at-r-md);
}
.header-actions .at-btn.is-active {
  background: var(--at-canvas);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* Toolbar */
.catalog-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--at-s-sm);
  margin-bottom: var(--at-s-lg);
}
.catalog-search {
  display: flex;
  align-items: center;
  gap: var(--at-s-xs);
  padding: 0 var(--at-s-sm);
  background: var(--at-canvas);
  border: 1px solid var(--at-hairline);
  border-radius: var(--at-r-sm);
  height: 44px;
  max-width: 480px;
}
.catalog-search:focus-within { border-color: var(--at-info-border); }
.catalog-search__input {
  border: 0;
  background: transparent;
  flex: 1;
  font-size: 14px;
  color: var(--at-ink);
  outline: none;
  font-family: inherit;
}
.catalog-search__input::placeholder { color: var(--at-muted); }

.catalog-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.filter-chip {
  background: var(--at-canvas);
  color: var(--at-body);
  border: 1px solid var(--at-hairline);
  border-radius: var(--at-r-pill);
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}
.filter-chip.is-active {
  background: var(--at-ink);
  color: var(--at-on-primary);
  border-color: var(--at-ink);
}

.trigger-targets {
  padding: var(--at-s-sm);
  border: 1px solid var(--at-hairline);
  border-radius: var(--at-r-md);
  background: var(--at-surface-soft);
}

.trigger-targets__toggle {
  margin-top: var(--at-s-sm);
}

.trigger-target-row {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(240px, 1fr) 32px;
  gap: 8px;
  align-items: start;
  margin-bottom: 8px;
}

.trigger-target-row__remove {
  min-width: 32px;
  height: 36px;
}

@media (max-width: 720px) {
  .trigger-target-row {
    grid-template-columns: 1fr 32px;
  }

  .trigger-target-row .at-input {
    grid-column: 1 / 2;
  }

  .trigger-target-row__remove {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
}

/* Groups */
.catalog-group { margin-bottom: var(--at-s-xl); }
.catalog-group__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--at-s-sm);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--at-muted);
}
.catalog-group__count {
  background: var(--at-surface-soft);
  padding: 2px 8px;
  border-radius: var(--at-r-pill);
  font-size: 11px;
  font-weight: 500;
  color: var(--at-body);
}

/* Cards */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--at-s-sm);
}
.catalog-card {
  background: var(--at-canvas);
  border: 1px solid var(--at-hairline);
  border-radius: var(--at-r-md);
  padding: var(--at-s-md);
  display: flex;
  flex-direction: column;
  gap: var(--at-s-sm);
  position: relative;
  transition: border-color 0.1s;
}
.catalog-card::before {
  content: '';
  position: absolute;
  left: 0; top: var(--at-s-sm); bottom: var(--at-s-sm);
  width: 3px;
  border-radius: 2px;
  background: var(--card-accent);
  opacity: 0;
  transition: opacity 0.1s;
}
.catalog-card:hover::before { opacity: 1; }
.catalog-card:hover { border-color: var(--card-accent); }

.catalog-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.catalog-card__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--at-r-md);
  background: var(--card-tint);
  color: var(--card-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.catalog-card__binding {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--at-muted);
  padding: 4px 8px;
  border: 1px solid var(--at-hairline);
  border-radius: var(--at-r-sm);
}
.catalog-card__title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--at-ink);
  margin: 0;
}
.catalog-card__desc {
  font-size: 13px;
  line-height: 1.45;
  color: var(--at-body);
  margin: 0;
  min-height: 36px;
}

/* Configured table — desktop grid, mobile card list */
.configured-table {
  background: var(--at-canvas);
  border: 1px solid var(--at-hairline);
  border-radius: var(--at-r-md);
  overflow: hidden;
}
.configured-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.5fr 80px 180px;
  align-items: center;
  padding: var(--at-s-sm) var(--at-s-md);
  border-bottom: 1px solid var(--at-hairline);
  gap: var(--at-s-sm);
  font-size: 14px;
}
.configured-row:last-child { border-bottom: 0; }
.configured-row--head {
  background: var(--at-surface-soft);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--at-muted);
}
.cell-trig { display: flex; align-items: center; gap: var(--at-s-sm); min-width: 0; }
.trig-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--at-r-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.trig-name {
  font-weight: 500;
  color: var(--at-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.trig-meta { font-size: 12px; color: var(--at-muted); margin-top: 2px; }
.binding-link {
  color: var(--at-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.binding-link--error { color: var(--at-coral); font-size: 13px; }
.cell-center { text-align: center; }
.cell-right { text-align: right; }
.cell-actions { display: flex; justify-content: flex-end; gap: 2px; }

/* Tablet: tighten table */
@media (min-width: 768px) and (max-width: 1023px) {
  .configured-row {
    grid-template-columns: 1.8fr 1fr 1.2fr 64px 140px;
    padding: var(--at-s-sm);
    font-size: 13px;
  }
  .trig-avatar { width: 32px; height: 32px; }
}

/* Mobile: convert table to vertical card list */
@media (max-width: 767px) {
  .configured-row--head { display: none; }
  .configured-row {
    grid-template-columns: 1fr;
    gap: var(--at-s-xs);
    padding: var(--at-s-md);
    grid-template-areas:
      "trig"
      "event"
      "binding"
      "footer";
  }
  .configured-row > div:nth-child(1) { grid-area: trig; }
  .configured-row > div:nth-child(2) { grid-area: event; }
  .configured-row > div:nth-child(3) { grid-area: binding; }
  .configured-row > div:nth-child(4) {
    /* Switch cell: move into footer row */
    grid-area: footer;
    justify-self: flex-start;
    text-align: left;
    display: flex;
    align-items: center;
    gap: var(--at-s-xs);
  }
  .configured-row > div:nth-child(4)::before {
    content: 'Bật';
    font-size: 12px;
    color: var(--at-muted);
    font-weight: 500;
  }
  .configured-row > div:nth-child(5) {
    /* Actions: same footer row, right-aligned */
    grid-area: footer;
    justify-self: flex-end;
    margin-left: auto;
  }
  .cell-trig { padding-bottom: 4px; border-bottom: 1px dashed var(--at-hairline); }
  .trig-avatar { width: 40px; height: 40px; }
  .binding-link { white-space: normal; }
}

/* Editor dialog */
.editor-card {
  background: var(--at-canvas);
  border-radius: var(--at-r-md);
  overflow: hidden;
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
}
.editor-card__head {
  display: flex;
  align-items: center;
  gap: var(--at-s-sm);
  padding: var(--at-s-md);
  flex: 0 0 auto;
}
.editor-card__close {
  margin-left: auto;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--at-muted);
  padding: 6px;
  border-radius: var(--at-r-sm);
}
.editor-card__close:hover { background: var(--at-surface-soft); }
.editor-card__body {
  padding: var(--at-s-md);
  display: flex;
  flex-direction: column;
  gap: var(--at-s-sm);
  min-height: 0;
  overflow-y: auto;
}
.editor-card__foot {
  padding: var(--at-s-md);
  display: flex;
  justify-content: flex-end;
  gap: var(--at-s-xs);
  flex: 0 0 auto;
}

.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--at-ink);
}
.form-hint { margin-top: 2px; color: var(--at-muted); }

.form-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-top: var(--at-s-xs);
}
.form-toggle input { width: 16px; height: 16px; }

.form-hint code {
  background: var(--at-surface-soft);
  padding: 1px 6px;
  border-radius: var(--at-r-xs);
  font-size: 12px;
  border: 1px solid var(--at-hairline);
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}
.cron-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.cron-presets .filter-chip { padding: 4px 10px; font-size: 12px; }

.form-error {
  padding: 10px 12px;
  background: rgba(170, 45, 0, 0.08);
  border: 1px solid rgba(170, 45, 0, 0.3);
  border-radius: var(--at-r-sm);
  font-size: 13px;
  color: var(--at-coral);
}
</style>
