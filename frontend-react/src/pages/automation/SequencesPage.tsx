import { useCallback } from 'react';
import { fetchAutomationSequences } from '../../api/automation';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import AutomationTable from '../../components/automation/AutomationTable';
import SequenceStepEditor from '../../components/automation/phase7/SequenceStepEditor';
import type { AutomationSequence } from '../../types/automation';
import { useCrmResource } from '../crm/useCrmResource';

export default function SequencesPage() {
  const loader = useCallback(() => fetchAutomationSequences(), []);
  const { data: sequences, loading, error } = useCrmResource(loader, [] as AutomationSequence[]);

  return (
    <section className="space-y-4">
      <AutomationPageHeader description="Chuỗi chăm sóc khách hàng theo block và delay." meta={loading ? 'Đang tải...' : `${sequences.length} sequence`} title="BotAuto.Sequences" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <AutomationTable
        columns={[
          { key: 'name', label: 'Sequence', render: (sequence) => <span className="font-medium text-slate-950">{sequence.name}</span> },
          { key: 'steps', label: 'Bước', render: (sequence) => sequence.steps?.length ?? 0 },
          { key: 'enrolled', label: 'Đang chạy', render: (sequence) => sequence.enrolledCount ?? 0 },
          { key: 'enabled', label: 'Trạng thái', render: (sequence) => (sequence.enabled ? 'Đang bật' : 'Tắt') },
        ]}
        emptyLabel="Chưa có sequence."
        rows={sequences}
      />
      <SequenceStepEditor />
    </section>
  );
}
