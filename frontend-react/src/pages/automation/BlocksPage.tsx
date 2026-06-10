import { useCallback } from 'react';
import { fetchAutomationBlocks } from '../../api/automation';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import AutomationTable from '../../components/automation/AutomationTable';
import BlockEditorDialog from '../../components/automation/phase7/BlockEditorDialog';
import type { AutomationBlock } from '../../types/automation';
import { useCrmResource } from '../crm/useCrmResource';

export default function BlocksPage() {
  const loader = useCallback(() => fetchAutomationBlocks(), []);
  const { data: blocks, loading, error } = useCrmResource(loader, [] as AutomationBlock[]);

  return (
    <section className="space-y-4">
      <AutomationPageHeader description="Thư viện block hành động dùng cho trigger, sequence và broadcast." meta={loading ? 'Đang tải...' : `${blocks.length} block`} title="BotAuto.Blocks" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <AutomationTable
        columns={[
          { key: 'name', label: 'Block', render: (block) => <span className="font-medium text-slate-950">{block.name}</span> },
          { key: 'actionType', label: 'Hành động', render: (block) => block.actionType ?? '-' },
          { key: 'folder', label: 'Thư mục', render: (block) => block.folder?.name ?? '-' },
          { key: 'usage', label: 'Lượt dùng', render: (block) => block.usageCount ?? 0 },
        ]}
        emptyLabel="Chưa có block."
        rows={blocks}
      />
      <BlockEditorDialog />
    </section>
  );
}
