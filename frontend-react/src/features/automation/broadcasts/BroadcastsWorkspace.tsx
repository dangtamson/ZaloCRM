import { useEffect, useMemo, useState } from 'react';
import {
  createBroadcast,
  deleteBroadcast,
  fetchAutomationBlocks,
  fetchAutomationBroadcasts,
  fetchCustomerListsPage,
  pauseBroadcast,
  resumeBroadcast,
  startBroadcast,
  cancelBroadcast,
  updateBroadcast,
} from '../api';
import type { AutomationBlock, AutomationBroadcast, BroadcastPacing, BroadcastState, CustomerListSummary, SegmentSpec } from '../types';
import AutomationToolbar from '../components/AutomationToolbar';
import AutomationTable from '../../../components/automation/AutomationTable';
import EditorDrawer from '../components/EditorDrawer';
import StatusBadge from '../components/StatusBadge';

type DraftScheduleKind = 'now' | 'scheduled' | 'recurring';
type DraftSegmentKind = 'filter' | 'manual' | 'customer-list';

interface DraftBroadcast {
  id?: string;
  name: string;
  description: string;
  blockId: string;
  scheduleKind: DraftScheduleKind;
  scheduledAt: string;
  segmentKind: DraftSegmentKind;
  manualContactIdsText: string;
  customerListId: string;
  birthdayThisWeek: boolean;
  birthdayToday: boolean;
  maxPerNickPerHour: number;
  allowedHourRangeStart: number;
  allowedHourRangeEnd: number;
}

function emptyDraft(): DraftBroadcast {
  return {
    name: '',
    description: '',
    blockId: '',
    scheduleKind: 'now',
    scheduledAt: '',
    segmentKind: 'filter',
    manualContactIdsText: '',
    customerListId: '',
    birthdayThisWeek: false,
    birthdayToday: false,
    maxPerNickPerHour: 50,
    allowedHourRangeStart: 6,
    allowedHourRangeEnd: 22,
  };
}

function stateLabel(state?: BroadcastState): string {
  return {
    draft: 'Nháp',
    scheduled: 'Lên lịch',
    running: 'Đang chạy',
    paused: 'Tạm dừng',
    completed: 'Hoàn thành',
    cancelled: 'Đã huỷ',
  }[state ?? 'draft'];
}

function segmentLabel(segment?: SegmentSpec): string {
  if (!segment) return '-';
  if (segment.kind === 'manual') return `Manual (${segment.contactIds.length})`;
  if (segment.kind === 'customer-list') return `List ${segment.listId}`;
  return 'Filter';
}

export default function BroadcastsWorkspace() {
  const [broadcasts, setBroadcasts] = useState<AutomationBroadcast[]>([]);
  const [blocks, setBlocks] = useState<AutomationBlock[]>([]);
  const [customerLists, setCustomerLists] = useState<CustomerListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | BroadcastState>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<DraftBroadcast>(emptyDraft());

  async function loadAll() {
    setLoading(true);
    try {
      const [broadcastItems, blockItems, customerListsItems] = await Promise.all([
        fetchAutomationBroadcasts(),
        fetchAutomationBlocks({ limit: 500 }),
        fetchCustomerListsPage({ status: 'active', limit: 100 }),
      ]);
      setBroadcasts(broadcastItems);
      setBlocks(blockItems);
      setCustomerLists(customerListsItems.lists);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return broadcasts.filter((item) => {
      const matchesState = stateFilter === 'all' || item.state === stateFilter;
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
      return matchesState && matchesSearch;
    });
  }, [broadcasts, search, stateFilter]);

  const countByState = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of broadcasts) counts[item.state ?? 'draft'] = (counts[item.state ?? 'draft'] ?? 0) + 1;
    return counts;
  }, [broadcasts]);

  const sendMessageBlocks = useMemo(
    () => blocks.filter((block) => block.actionType === 'send_message' && !block.archivedAt),
    [blocks],
  );

  function openCreate() {
    setDraft(emptyDraft());
    setError('');
    setEditorOpen(true);
  }

  function openEdit(item: AutomationBroadcast) {
    setDraft({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      blockId: item.blockId ?? '',
      scheduleKind: item.scheduleKind ?? 'now',
      scheduledAt: item.scheduledAt ?? '',
      segmentKind: item.segmentSpec?.kind ?? 'filter',
      manualContactIdsText: item.segmentSpec?.kind === 'manual' ? item.segmentSpec.contactIds.join('\n') : '',
      customerListId: item.segmentSpec?.kind === 'customer-list' ? item.segmentSpec.listId : '',
      birthdayThisWeek: item.segmentSpec?.kind === 'customer-list' ? Boolean(item.segmentSpec.birthdayThisWeek) : false,
      birthdayToday: item.segmentSpec?.kind === 'customer-list' ? Boolean(item.segmentSpec.birthdayToday) : false,
      maxPerNickPerHour: item.pacing?.maxPerNickPerHour ?? 50,
      allowedHourRangeStart: item.pacing?.allowedHourRange?.[0] ?? 6,
      allowedHourRangeEnd: item.pacing?.allowedHourRange?.[1] ?? 22,
    });
    setError('');
    setEditorOpen(true);
  }

  function buildSegmentSpec(): SegmentSpec | null {
    if (draft.segmentKind === 'manual') {
      const contactIds = draft.manualContactIdsText.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!contactIds.length) {
        setError('Cần ít nhất 1 contactId');
        return null;
      }
      return { kind: 'manual', contactIds };
    }
    if (draft.segmentKind === 'customer-list') {
      if (!draft.customerListId.trim()) {
        setError('Cần listId');
        return null;
      }
      return {
        kind: 'customer-list',
        listId: draft.customerListId.trim(),
        ...(draft.birthdayThisWeek ? { birthdayThisWeek: true } : {}),
        ...(draft.birthdayToday ? { birthdayToday: true } : {}),
      };
    }
    return { kind: 'filter', criteria: { hasZalo: true, acceptedNicksCount: { gt: 0 } } };
  }

  async function saveBroadcast() {
    setError('');
    if (!draft.name.trim()) {
      setError('Tên không được rỗng');
      return;
    }
    if (!draft.blockId) {
      setError('Phải chọn block');
      return;
    }
    const segmentSpec = buildSegmentSpec();
    if (!segmentSpec) return;

    const pacing: BroadcastPacing = {
      maxPerNickPerHour: draft.maxPerNickPerHour,
      allowedHourRange: [draft.allowedHourRangeStart, draft.allowedHourRangeEnd],
      randomDelayBetweenSends: { min: 15, max: 45 },
      distributeAcrossNicks: true,
    };

    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        blockId: draft.blockId,
        segmentSpec,
        scheduleKind: draft.scheduleKind,
        scheduledAt: draft.scheduleKind === 'scheduled' ? draft.scheduledAt || undefined : undefined,
        pacing,
      };
      if (draft.id) {
        await updateBroadcast(draft.id, payload);
      } else {
        await createBroadcast(payload);
      }
      setEditorOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function runBroadcast(item: AutomationBroadcast) {
    if (!window.confirm(`Chạy "${item.name}" ngay?`)) return;
    if (item.state === 'paused') {
      await resumeBroadcast(item.id);
    } else {
      await startBroadcast(item.id);
    }
    await loadAll();
  }

  async function pause(item: AutomationBroadcast) {
    await pauseBroadcast(item.id);
    await loadAll();
  }

  async function cancel(item: AutomationBroadcast) {
    if (!window.confirm(`Huỷ "${item.name}"?`)) return;
    await cancelBroadcast(item.id);
    await loadAll();
  }

  async function remove(item: AutomationBroadcast) {
    if (!window.confirm(`Xoá nháp "${item.name}"?`)) return;
    await deleteBroadcast(item.id);
    await loadAll();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {(['all', 'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'] as const).map((state) => (
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium ${stateFilter === state ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
            key={state}
            onClick={() => setStateFilter(state)}
            type="button"
          >
            {state === 'all' ? 'Tất cả' : stateLabel(state)}
            {countByState[state] ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{countByState[state]}</span> : null}
          </button>
        ))}
      </div>

      <AutomationToolbar
        createLabel="Broadcast mới"
        filters={null}
        onCreate={openCreate}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm broadcast"
      />

      <AutomationTable
        actions={(item) => (
          <div className="flex justify-end gap-2">
            {(item.state === 'draft' || item.state === 'scheduled' || item.state === 'paused') ? (
              <button className="text-blue-700 hover:text-blue-900" onClick={() => runBroadcast(item)} type="button">
                {item.state === 'paused' ? `Tiếp tục ${item.name}` : `Chạy ${item.name}`}
              </button>
            ) : null}
            {item.state === 'running' ? (
              <button className="text-amber-700 hover:text-amber-900" onClick={() => pause(item)} type="button">
                Tạm dừng {item.name}
              </button>
            ) : null}
            {item.state === 'running' || item.state === 'paused' || item.state === 'scheduled' ? (
              <button className="text-rose-700 hover:text-rose-900" onClick={() => cancel(item)} type="button">
                Huỷ {item.name}
              </button>
            ) : null}
            {item.state === 'draft' ? (
              <>
                <button className="text-blue-700 hover:text-blue-900" onClick={() => openEdit(item)} type="button">Sửa</button>
                <button className="text-rose-700 hover:text-rose-900" onClick={() => remove(item)} type="button">Xoá</button>
              </>
            ) : null}
          </div>
        )}
        columns={[
          { key: 'name', label: 'Broadcast', render: (item) => <div className="space-y-1"><div className="font-medium text-slate-950">{item.name}</div><div className="text-xs text-slate-500">{item.description ?? segmentLabel(item.segmentSpec)}</div></div> },
          { key: 'state', label: 'Trạng thái', render: (item) => <StatusBadge tone={item.state === 'running' ? 'success' : item.state === 'paused' ? 'warning' : item.state === 'cancelled' ? 'danger' : item.state === 'scheduled' ? 'info' : 'neutral'}>{stateLabel(item.state)}</StatusBadge> },
          { key: 'recipients', label: 'Người nhận', render: (item) => item.totalRecipients ?? 0 },
          { key: 'sent', label: 'Đã gửi', render: (item) => item.sentCount ?? 0 },
        ]}
        emptyLabel={loading ? 'Đang tải...' : 'Chưa có broadcast.'}
        rows={filtered}
      />

      <EditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} title={draft.id ? 'Sửa broadcast' : 'Tạo broadcast'}>
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tên broadcast</span>
            <input className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mô tả</span>
            <input className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Block gửi tin</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.blockId} onChange={(event) => setDraft((current) => ({ ...current, blockId: event.target.value }))}>
                <option value="">--</option>
                {sendMessageBlocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Lịch chạy</span>
              <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.scheduleKind} onChange={(event) => setDraft((current) => ({ ...current, scheduleKind: event.target.value as DraftScheduleKind }))}>
                <option value="now">Chạy ngay</option>
                <option value="scheduled">Lên lịch</option>
                <option value="recurring">Lặp lại</option>
              </select>
            </label>
          </div>
          {draft.scheduleKind === 'scheduled' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Thời điểm chạy</span>
              <input className="h-10 w-full rounded-md border border-slate-200 px-3" type="datetime-local" value={draft.scheduledAt} onChange={(event) => setDraft((current) => ({ ...current, scheduledAt: event.target.value }))} />
            </label>
          ) : null}
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Segment</span>
            <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.segmentKind} onChange={(event) => setDraft((current) => ({ ...current, segmentKind: event.target.value as DraftSegmentKind }))}>
              <option value="filter">Filter</option>
              <option value="manual">Manual list</option>
              <option value="customer-list">Customer list</option>
            </select>
          </label>
          {draft.segmentKind === 'manual' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">contactId mỗi dòng</span>
              <textarea className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2" value={draft.manualContactIdsText} onChange={(event) => setDraft((current) => ({ ...current, manualContactIdsText: event.target.value }))} />
            </label>
          ) : null}
          {draft.segmentKind === 'customer-list' ? (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Customer list</span>
                <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.customerListId} onChange={(event) => setDraft((current) => ({ ...current, customerListId: event.target.value }))}>
                  <option value="">--</option>
                  {customerLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input checked={draft.birthdayThisWeek} onChange={(event) => setDraft((current) => ({ ...current, birthdayThisWeek: event.target.checked }))} type="checkbox" />
                  Sinh nhật trong tuần
                </label>
                <label className="flex items-center gap-2">
                  <input checked={draft.birthdayToday} onChange={(event) => setDraft((current) => ({ ...current, birthdayToday: event.target.checked }))} type="checkbox" />
                  Sinh nhật hôm nay
                </label>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Max msg/giờ/nick</span>
              <input className="h-10 w-full rounded-md border border-slate-200 px-3" min={1} max={300} type="number" value={draft.maxPerNickPerHour} onChange={(event) => setDraft((current) => ({ ...current, maxPerNickPerHour: Number(event.target.value) }))} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Giờ bắt đầu</span>
                <input className="h-10 w-full rounded-md border border-slate-200 px-3" min={0} max={23} type="number" value={draft.allowedHourRangeStart} onChange={(event) => setDraft((current) => ({ ...current, allowedHourRangeStart: Number(event.target.value) }))} />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Giờ kết thúc</span>
                <input className="h-10 w-full rounded-md border border-slate-200 px-3" min={0} max={23} type="number" value={draft.allowedHourRangeEnd} onChange={(event) => setDraft((current) => ({ ...current, allowedHourRangeEnd: Number(event.target.value) }))} />
              </label>
            </div>
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setEditorOpen(false)} type="button">Hủy</button>
            <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white" disabled={saving} onClick={saveBroadcast} type="button">
              {saving ? 'Đang lưu...' : 'Lưu broadcast'}
            </button>
          </div>
        </div>
      </EditorDrawer>
    </section>
  );
}
