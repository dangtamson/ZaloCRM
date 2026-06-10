import { useEffect, useMemo, useState } from 'react';
import { fetchAutomationBlocks, fetchAutomationSequences, createSequence, updateSequence, enableSequence, disableSequence, duplicateSequence, deleteSequence } from '../api';
import type { AutomationBlock, AutomationSequence, SequenceRuntimeRules, SequenceStep } from '../types';
import AutomationToolbar from '../components/AutomationToolbar';
import AutomationTable from '../../../components/automation/AutomationTable';
import EditorDrawer from '../components/EditorDrawer';
import SequenceStepEditor from './SequenceStepEditor';

interface DraftSequence {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  steps: SequenceStep[];
  runtimeRules: SequenceRuntimeRules;
}

function emptyDraft(): DraftSequence {
  return {
    name: '',
    description: '',
    enabled: true,
    steps: [],
    runtimeRules: { allowedHourRange: [6, 22], perNickThrottle: true, crossNickRecencyDays: 30, stopOnAccept: true },
  };
}

export default function SequencesWorkspace() {
  const [sequences, setSequences] = useState<AutomationSequence[]>([]);
  const [blocks, setBlocks] = useState<AutomationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftSequence>(emptyDraft());

  async function loadAll() {
    setLoading(true);
    try {
      const [sequenceItems, blockItems] = await Promise.all([
        fetchAutomationSequences(),
        fetchAutomationBlocks({ limit: 500 }),
      ]);
      setSequences(sequenceItems);
      setBlocks(blockItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredSequences = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? sequences.filter((sequence) => sequence.name.toLowerCase().includes(q)) : sequences;
  }, [search, sequences]);

  function openCreate() {
    setDraft(emptyDraft());
    setEditorOpen(true);
  }

  function openEdit(sequence: AutomationSequence) {
    setDraft({
      id: sequence.id,
      name: sequence.name,
      description: sequence.description ?? '',
      enabled: sequence.enabled ?? true,
      steps: sequence.steps?.length ? sequence.steps : [],
      runtimeRules: sequence.runtimeRules ?? { allowedHourRange: [6, 22], perNickThrottle: true, crossNickRecencyDays: 30, stopOnAccept: true },
    });
    setEditorOpen(true);
  }

  async function saveSequence() {
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      steps: draft.steps.map((step) => ({ ...step, delayMinutes: Number(step.delayMinutes) })),
      runtimeRules: draft.runtimeRules,
      enabled: draft.enabled,
    };
    if (draft.id) {
      const saved = await updateSequence(draft.id, payload);
      setSequences((current) => current.map((sequence) => (sequence.id === saved.id ? saved : sequence)));
    } else {
      const saved = await createSequence(payload);
      setSequences((current) => [saved, ...current]);
    }
    setEditorOpen(false);
  }

  async function toggleEnabled(sequence: AutomationSequence) {
    const saved = sequence.enabled ? await disableSequence(sequence.id) : await enableSequence(sequence.id);
    setSequences((current) => current.map((item) => (item.id === saved.id ? saved : item)));
  }

  async function onDuplicate(sequence: AutomationSequence) {
    const saved = await duplicateSequence(sequence.id);
    setSequences((current) => [saved, ...current]);
  }

  async function onDelete(sequence: AutomationSequence) {
    await deleteSequence(sequence.id);
    setSequences((current) => current.filter((item) => item.id !== sequence.id));
  }

  return (
    <section className="space-y-4">
      <AutomationToolbar
        createLabel="Tạo sequence"
        onCreate={openCreate}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm sequence"
      />

      <AutomationTable
        actions={(sequence) => (
          <div className="flex justify-end gap-2">
            <button className="text-blue-700 hover:text-blue-900" onClick={() => openEdit(sequence)} type="button">Sửa</button>
            <button className="text-slate-700 hover:text-slate-900" onClick={() => onDuplicate(sequence)} type="button">Nhân bản</button>
            <button className="text-emerald-700 hover:text-emerald-900" onClick={() => toggleEnabled(sequence)} type="button">
              {sequence.enabled ? 'Tắt' : 'Bật'}
            </button>
            <button className="text-rose-700 hover:text-rose-900" onClick={() => onDelete(sequence)} type="button">Xóa</button>
          </div>
        )}
        columns={[
          { key: 'name', label: 'Sequence', render: (sequence) => <span className="font-medium text-slate-950">{sequence.name}</span> },
          { key: 'steps', label: 'Bước', render: (sequence) => sequence.steps?.length ?? 0 },
          { key: 'enrolled', label: 'Đang chạy', render: (sequence) => sequence.enrolledCount ?? 0 },
          { key: 'enabled', label: 'Trạng thái', render: (sequence) => (sequence.enabled ? 'Đang bật' : 'Tắt') },
        ]}
        emptyLabel={loading ? 'Đang tải...' : 'Chưa có sequence.'}
        rows={filteredSequences}
      />

      <EditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} title={draft.id ? 'Sửa sequence' : 'Tạo sequence'}>
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tên sequence</span>
            <input className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Mô tả</span>
            <textarea className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2" value={draft.description} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} />
          </label>
          <SequenceStepEditor blocks={blocks} onChange={(steps) => setDraft((current) => ({ ...current, steps }))} steps={draft.steps} />
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <input checked={draft.enabled} onChange={(e) => setDraft((current) => ({ ...current, enabled: e.target.checked }))} type="checkbox" />
            Đang bật
          </div>
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setEditorOpen(false)} type="button">Hủy</button>
            <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white" onClick={saveSequence} type="button">Lưu sequence</button>
          </div>
        </div>
      </EditorDrawer>
    </section>
  );
}
