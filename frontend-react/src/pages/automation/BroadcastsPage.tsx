import { useCallback } from 'react';
import { fetchAutomationBroadcasts } from '../../api/automation';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import AutomationTable from '../../components/automation/AutomationTable';
import type { AutomationBroadcast } from '../../types/automation';
import { useCrmResource } from '../crm/useCrmResource';

export default function BroadcastsPage() {
  const loader = useCallback(() => fetchAutomationBroadcasts(), []);
  const { data: broadcasts, loading, error } = useCrmResource(loader, [] as AutomationBroadcast[]);

  return (
    <section className="space-y-4">
      <AutomationPageHeader description="Broadcast và remarketing theo block gửi tin." meta={loading ? 'Đang tải...' : `${broadcasts.length} broadcast`} title="BotAuto.Broadcasts" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <AutomationTable
        columns={[
          { key: 'name', label: 'Broadcast', render: (broadcast) => <span className="font-medium text-slate-950">{broadcast.name}</span> },
          { key: 'state', label: 'Trạng thái', render: (broadcast) => broadcast.state ?? '-' },
          { key: 'recipients', label: 'Người nhận', render: (broadcast) => broadcast.totalRecipients ?? 0 },
          { key: 'sent', label: 'Đã gửi', render: (broadcast) => broadcast.sentCount ?? 0 },
        ]}
        emptyLabel="Chưa có broadcast."
        rows={broadcasts}
      />
    </section>
  );
}
