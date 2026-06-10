import { useEffect, useMemo, useState } from 'react';
import { fetchAutomationBlocks, fetchBlockFolders, createBlock, updateBlock, archiveBlock, unarchiveBlock, duplicateBlock, type BlockCreateInput } from '../api';
import type { AutomationBlock, BlockActionType, BlockFolder } from '../types';
import AutomationToolbar from '../components/AutomationToolbar';
import AutomationTable from '../../../components/automation/AutomationTable';
import EditorDrawer from '../components/EditorDrawer';

const ACTION_OPTIONS: BlockActionType[] = ['request_friend', 'send_message', 'update_status'];

type DraftBlock = BlockCreateInput & { id?: string };

function emptyDraft(): DraftBlock {
  return {
    name: '',
    actionType: 'send_message',
    content: { textVariants: [''] },
    folderId: null,
    ownerNickId: null,
    isShared: false,
  };
}

export default function BlocksWorkspace() {
  const [blocks, setBlocks] = useState<AutomationBlock[]>([]);
  const [folders, setFolders] = useState<BlockFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<BlockActionType | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftBlock>(emptyDraft());

  async function loadAll() {
    setLoading(true);
    try {
      const [blockItems, folderItems] = await Promise.all([
        fetchAutomationBlocks({ includeArchived: true, limit: 500 }),
        fetchBlockFolders(),
      ]);
      setBlocks(blockItems);
      setFolders(folderItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) => {
      if (!showArchived && block.archivedAt) return false;
      if (selectedFolderId !== 'all' && block.folderId !== selectedFolderId) return false;
      if (selectedActionType !== 'all' && block.actionType !== selectedActionType) return false;
      if (search.trim() && !block.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [blocks, search, selectedActionType, selectedFolderId, showArchived]);

  function openCreate() {
    setDraft(emptyDraft());
    setEditorOpen(true);
  }

  function openEdit(block: AutomationBlock) {
    setDraft({
      id: block.id,
      name: block.name,
      actionType: block.actionType,
      content: block.content ?? {},
      folderId: block.folderId ?? null,
      ownerNickId: block.ownerNickId ?? null,
      isShared: block.isShared ?? false,
    });
    setEditorOpen(true);
  }

  async function saveBlock() {
    if (!draft.name.trim()) return;
    const payload: BlockCreateInput = {
      name: draft.name.trim(),
      actionType: draft.actionType,
      content: draft.content ?? {},
      folderId: draft.folderId ?? null,
      ownerNickId: draft.ownerNickId ?? null,
      isShared: draft.isShared ?? false,
    };
    if (draft.actionType === 'send_message') {
      const text = String((payload.content as { textVariants?: string[] }).textVariants?.[0] ?? '');
      payload.content = { textVariants: [text] };
    }
    if (draft.actionType === 'request_friend') {
      const greeting = String((payload.content as { greetingVariants?: string[] }).greetingVariants?.[0] ?? '');
      payload.content = { greetingVariants: [greeting] };
    }
    if (draft.actionType === 'update_status') {
      payload.content = { ...(payload.content ?? {}), statusId: String((payload.content as { statusId?: string }).statusId ?? '') };
    }
    if (draft.id) {
      const saved = await updateBlock(draft.id, payload);
      setBlocks((current) => current.map((block) => (block.id === saved.id ? saved : block)));
    } else {
      const saved = await createBlock(payload);
      setBlocks((current) => [saved, ...current]);
    }
    setEditorOpen(false);
  }

  async function onArchive(block: AutomationBlock) {
    const saved = await archiveBlock(block.id);
    setBlocks((current) => current.map((item) => (item.id === saved.id ? saved : item)));
  }

  async function onUnarchive(block: AutomationBlock) {
    const saved = await unarchiveBlock(block.id);
    setBlocks((current) => current.map((item) => (item.id === saved.id ? saved : item)));
  }

  async function onDuplicate(block: AutomationBlock) {
    const saved = await duplicateBlock(block.id);
    setBlocks((current) => [saved, ...current]);
  }

  return (
    <section className="space-y-4">
      <AutomationToolbar
        createLabel="Tạo block"
        filters={
          <>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={selectedActionType} onChange={(e) => setSelectedActionType(e.target.value as BlockActionType | 'all')}>
              <option value="all">Tất cả action</option>
              {ACTION_OPTIONS.map((actionType) => <option key={actionType} value={actionType}>{actionType}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={selectedFolderId} onChange={(e) => setSelectedFolderId(e.target.value)}>
              <option value="all">Tất cả folder</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
            <label className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <input checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} type="checkbox" />
              Archived
            </label>
          </>
        }
        onCreate={openCreate}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm block"
      />

      <AutomationTable
        actions={(block) => (
          <div className="flex justify-end gap-2">
            <button className="text-blue-700 hover:text-blue-900" onClick={() => openEdit(block)} type="button">Sửa</button>
            <button className="text-slate-700 hover:text-slate-900" onClick={() => onDuplicate(block)} type="button">Nhân bản</button>
            {block.archivedAt ? (
              <button className="text-emerald-700 hover:text-emerald-900" onClick={() => onUnarchive(block)} type="button">Khôi phục {block.name}</button>
            ) : (
              <button className="text-amber-700 hover:text-amber-900" onClick={() => onArchive(block)} type="button">Lưu trữ {block.name}</button>
            )}
          </div>
        )}
        columns={[
          { key: 'name', label: 'Block', render: (block) => <span className="font-medium text-slate-950">{block.name}</span> },
          { key: 'actionType', label: 'Hành động', render: (block) => block.actionType },
          { key: 'folder', label: 'Thư mục', render: (block) => block.folder?.name ?? '-' },
          { key: 'usage', label: 'Lượt dùng', render: (block) => block.usageCount ?? 0 },
        ]}
        emptyLabel={loading ? 'Đang tải...' : 'Chưa có block.'}
        rows={filteredBlocks}
      />

      <EditorDrawer open={editorOpen} onClose={() => setEditorOpen(false)} title={draft.id ? 'Sửa block' : 'Tạo block'}>
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Tên block</span>
            <input className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Action type</span>
            <select className="h-10 w-full rounded-md border border-slate-200 px-3" value={draft.actionType} onChange={(e) => setDraft((current) => ({ ...current, actionType: e.target.value as BlockActionType }))}>
              {ACTION_OPTIONS.map((actionType) => <option key={actionType} value={actionType}>{actionType}</option>)}
            </select>
          </label>
          {draft.actionType === 'send_message' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Nội dung tin nhắn</span>
              <textarea
                className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2"
                value={String((draft.content as { textVariants?: string[] })?.textVariants?.[0] ?? '')}
                onChange={(e) => setDraft((current) => ({ ...current, content: { textVariants: [e.target.value] } }))}
              />
            </label>
          ) : null}
          {draft.actionType === 'request_friend' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Lời chào</span>
              <textarea
                className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2"
                value={String((draft.content as { greetingVariants?: string[] })?.greetingVariants?.[0] ?? '')}
                onChange={(e) => setDraft((current) => ({ ...current, content: { greetingVariants: [e.target.value] } }))}
              />
            </label>
          ) : null}
          {draft.actionType === 'update_status' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Status id</span>
              <input
                className="h-10 w-full rounded-md border border-slate-200 px-3"
                value={String((draft.content as { statusId?: string })?.statusId ?? '')}
                onChange={(e) => setDraft((current) => ({ ...current, content: { statusId: e.target.value } }))}
              />
            </label>
          ) : null}
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setEditorOpen(false)} type="button">
              Hủy
            </button>
            <button className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white" onClick={saveBlock} type="button">
              Lưu block
            </button>
          </div>
        </div>
      </EditorDrawer>
    </section>
  );
}
