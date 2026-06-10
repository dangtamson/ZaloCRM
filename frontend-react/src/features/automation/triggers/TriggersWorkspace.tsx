import { useEffect, useMemo, useState } from 'react';
import {
  fetchTriggerCatalog,
  fetchAutomationTriggers,
  fetchAutomationSequences,
  fetchAutomationBlocks,
  fetchCustomerLists,
  createTrigger,
  updateTrigger,
  enableTrigger,
  disableTrigger,
  runTrigger,
} from '../api';
import type { AutomationBlock, AutomationSequence, AutomationTrigger, CustomerListSummary, TriggerBindingKind, TriggerCatalogEntry, TriggerCategory, TriggerEventType } from '../types';
import AutomationToolbar from '../components/AutomationToolbar';
import AutomationTable from '../../../components/automation/AutomationTable';
import EditorDrawer from '../components/EditorDrawer';
import StatusBadge from '../components/StatusBadge';

interface DraftTrigger {
  id?: string;
  name: string;
  category: TriggerCategory | 'general';
  eventType: TriggerEventType;
  bindingKind: TriggerBindingKind;
  sequenceId: string;
  blockId: string;
  broadcastId: string;
  enabled: boolean;
  segmentKind: 'none' | 'customer-list';
  customerListId: string;
  birthdayThisWeek: boolean;
  birthdayToday: boolean;
}

function emptyDraft(catalog?: TriggerCatalogEntry): DraftTrigger {
  return {
    name: '',
    category: catalog?.category ?? 'general',
    eventType: catalog?.eventType ?? 'birthday',
    bindingKind: catalog?.recommendedBinding ?? 'sequence',
    sequenceId: '',
    blockId: '',
    broadcastId: '',
    enabled: true,
    segmentKind: 'none',
    customerListId: '',
    birthdayThisWeek: false,
    birthdayToday: false,
  };
}

export default function TriggersWorkspace() {
  const [catalog, setCatalog] = useState<TriggerCatalogEntry[]>([]);
  const [configured, setConfigured] = useState<AutomationTrigger[]>([]);
  const [sequences, setSequences] = useState<AutomationSequence[]>([]);
  const [blocks, setBlocks] = useState<AutomationBlock[]>([]);
  const [customerLists, setCustomerLists] = useState<CustomerListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'configured' | 'catalog'>('configured');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftTrigger>(emptyDraft());

  async function loadAll() {
    setLoading(true);
    try {
      const [catalogItems, triggerItems, sequenceItems, blockItems, listItems] = await Promise.all([
        fetchTriggerCatalog(),
        fetchAutomationTriggers(),
        fetchAutomationSequences(),
        fetchAutomationBlocks({ limit: 500 }),
        fetchCustomerLists({ status: 'active', limit: 100 }),
      ]);
      setCatalog(catalogItems);
      setConfigured(triggerItems);
      setSequences(sequenceItems);
      setBlocks(blockItems);
      setCustomerLists(listItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredConfigured = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? configured.filter((trigger) => trigger.name.toLowerCase().includes(q)) : configured;
  }, [configured, search]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? catalog.filter((entry) => entry.title.toLowerCase().includes(q) || entry.eventType.toLowerCase().includes(q)) : catalog;
  }, [catalog, search]);

  function openCreateFromCatalog(entry?: TriggerCatalogEntry) {
    setDraft(emptyDraft(entry));
    setEditorOpen(true);
  }

  function openEdit(trigger: AutomationTrigger) {
    setDraft({
      id: trigger.id,
      name: trigger.name,
      category: trigger.category ?? 'general',
      eventType: trigger.eventType,
      bindingKind: trigger.bindingKind ?? 'sequence',
      sequenceId: trigger.sequenceId ?? '',
      blockId: trigger.blockId ?? '',
      broadcastId: trigger.broadcastId ?? '',
      enabled: trigger.enabled ?? true,
      segmentKind: trigger.segmentSpec ? 'customer-list' : 'none',
      customerListId: String((trigger.segmentSpec as { listId?: string } | null)?.listId ?? ''),
      birthdayThisWeek: Boolean((trigger.segmentSpec as { birthdayThisWeek?: boolean } | null)?.birthdayThisWeek),
      birthdayToday: Boolean((trigger.segmentSpec as { birthdayToday?: boolean } | null)?.birthdayToday),
    });
    setEditorOpen(true);
  }

  function buildSegmentSpec() {
    if (draft.segmentKind === 'customer-list' && draft.customerListId) {
      return {
        kind: 'customer-list',
        listId: draft.customerListId,
        birthdayThisWeek: draft.birthdayThisWeek,
        birthdayToday: draft.birthdayToday,
      };
    }
    return null;
  }

  async function saveTrigger() {
    const payload = {
      name: draft.name.trim(),
      category: draft.category === 'general' ? undefined : draft.category,
      eventType: draft.eventType,
      bindingKind: draft.bindingKind,
      sequenceId: draft.sequenceId || null,
      blockId: draft.blockId || null,
      broadcastId: draft.broadcastId || null,
      segmentSpec: buildSegmentSpec(),
      enabled: draft.enabled,
    };
    if (draft.id) {
      const saved = await updateTrigger(draft.id, payload);
      setConfigured((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    } else {
      const saved = await createTrigger(payload);
      setConfigured((current) => [saved, ...current]);
    }
    setEditorOpen(false);
  }

  async function toggleTrigger(trigger: AutomationTrigger) {
    const saved = trigger.enabled ? await disableTrigger(trigger.id) : await enableTrigger(trigger.id);
    setConfigured((current) => current.map((item) => (item.id === saved.id ? saved : item)));
  }

  async function manualRun(trigger: AutomationTrigger) {
    await runTrigger(trigger.id, {});
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
        <button className={`rounded-md px-3 py-2 text-sm font-medium ${tab === 'configured' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`} onClick={() => setTab('configured')} type="button">Configured</button>
        <button className={`rounded-md px-3 py-2 text-sm font-medium ${tab === 'catalog' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`} onClick={() => setTab('catalog')} type="button">Catalog</button>
      </div>

      <AutomationToolbar
        createLabel="Tạo trigger"
        onCreate={() => openCreateFromCatalog()}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm trigger"
      />

      {tab === 'configured' ? (
        <AutomationTable
          actions={(trigger) => (
            <div className="flex justify-end gap-2">
              <button className="text-blue-700 hover:text-blue-900" onClick={() => openEdit(trigger)} type="button">Sửa</button>
              <button className="text-emerald-700 hover:text-emerald-900" onClick={() => toggleTrigger(trigger)} type="button">
                {trigger.enabled ? `Tắt ${trigger.name}` : `Bật ${trigger.name}`}
              </button>
              <button className="text-slate-700 hover:text-slate-900" onClick={() => manualRun(trigger)} type="button">Chạy {trigger.name}</button>
            </div>
          )}
          columns={[
            { key: 'name', label: 'Tên', render: (trigger) => <span className="font-medium text-slate-950">{trigger.name}</span> },
            { key: 'eventType', label: 'Sự kiện', render: (trigger) => trigger.eventType },
            { key: 'bindingKind', label: 'Binding', render: (trigger) => trigger.bindingKind ?? trigger.sequence?.name ?? trigger.broadcast?.name ?? '-' },
            { key: 'enabled', label: 'Trạng thái', render: (trigger) => (trigger.enabled ? <StatusBadge tone="success">Đang bật</StatusBadge> : <StatusBadge tone="neutral">Tắt</StatusBadge>) },
          ]}
          emptyLabel={loading ? 'Đang tải...' : 'Chưa có trigger.'}
          rows={filteredConfigured}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredCatalog.map((entry) => (
            <button className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50/40" key={entry.eventType} onClick={() => openCreateFromCatalog(entry)} type="button">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">{entry.title}</h3>
                <StatusBadge tone="info">{entry.category ?? 'general'}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{entry.description ?? entry.eventType}</p>
            </button>
          ))}
        </div>
      )}

      <EditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} title={draft.id ? 'Sửa trigger' : 'Tạo trigger'}>
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tên trigger</span>
            <input className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Sự kiện</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.eventType} onChange={(e) => setDraft((current) => ({ ...current, eventType: e.target.value as TriggerEventType }))}>
                {catalog.map((entry) => <option key={entry.eventType} value={entry.eventType}>{entry.eventType}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Binding</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.bindingKind} onChange={(e) => setDraft((current) => ({ ...current, bindingKind: e.target.value as TriggerBindingKind }))}>
                <option value="sequence">sequence</option>
                <option value="block">block</option>
                <option value="broadcast">broadcast</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Sequence</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.sequenceId} onChange={(e) => setDraft((current) => ({ ...current, sequenceId: e.target.value }))}>
                <option value="">--</option>
                {sequences.map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Block</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.blockId} onChange={(e) => setDraft((current) => ({ ...current, blockId: e.target.value }))}>
                <option value="">--</option>
                {blocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Customer list</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.customerListId} onChange={(e) => setDraft((current) => ({ ...current, segmentKind: 'customer-list', customerListId: e.target.value }))}>
                <option value="">--</option>
                {customerLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input checked={draft.enabled} onChange={(e) => setDraft((current) => ({ ...current, enabled: e.target.checked }))} type="checkbox" />
              Đang bật
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setEditorOpen(false)} type="button">Hủy</button>
            <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white" onClick={saveTrigger} type="button">Lưu trigger</button>
          </div>
        </div>
      </EditorDrawer>
    </section>
  );
}
