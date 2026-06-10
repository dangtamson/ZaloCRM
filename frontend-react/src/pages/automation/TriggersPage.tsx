import { useCallback } from 'react';
import { fetchAutomationTriggers } from '../../api/automation';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import AutomationTable from '../../components/automation/AutomationTable';
import type { AutomationTrigger } from '../../types/automation';
import { useCrmResource } from '../crm/useCrmResource';

export default function TriggersPage() {
  const loader = useCallback(() => fetchAutomationTriggers(), []);
  const { data: triggers, loading, error } = useCrmResource(loader, [] as AutomationTrigger[]);

  return (
    <section className="space-y-4">
      <AutomationPageHeader description="Trigger tự động theo sự kiện CRM, Zalo và segment." meta={loading ? 'Đang tải...' : `${triggers.length} trigger`} title="BotAuto.Triggers" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <AutomationTable
        columns={[
          { key: 'name', label: 'Tên', render: (trigger) => <span className="font-medium text-slate-950">{trigger.name}</span> },
          { key: 'eventType', label: 'Sự kiện', render: (trigger) => trigger.eventType ?? '-' },
          { key: 'bindingKind', label: 'Binding', render: (trigger) => trigger.bindingKind ?? trigger.sequence?.name ?? trigger.broadcast?.name ?? '-' },
          { key: 'enabled', label: 'Trạng thái', render: (trigger) => (trigger.enabled ? 'Đang bật' : 'Tắt') },
        ]}
        emptyLabel="Chưa có trigger."
        rows={triggers}
      />
    </section>
  );
}
