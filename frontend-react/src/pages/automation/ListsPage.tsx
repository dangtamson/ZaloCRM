import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomerLists } from '../../api/automation';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import AutomationTable from '../../components/automation/AutomationTable';
import type { CustomerListSummary } from '../../types/automation';
import { useCrmResource } from '../crm/useCrmResource';

export default function ListsPage() {
  const loader = useCallback(() => fetchCustomerLists(), []);
  const { data: lists, loading, error } = useCrmResource(loader, [] as CustomerListSummary[]);

  return (
    <section className="space-y-4">
      <AutomationPageHeader description="Tệp người dùng dùng cho trigger, sequence và broadcast." meta={loading ? 'Đang tải...' : `${lists.length} tệp`} title="BotAuto.Lists" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <AutomationTable
        columns={[
          { key: 'name', label: 'Tệp', render: (list) => <Link className="font-medium text-blue-700 hover:text-blue-900" to={`/automation/bot/lists/${list.id}`}>{list.name}</Link> },
          { key: 'entries', label: 'Số dòng', render: (list) => `${list.totalEntries ?? 0} dòng` },
          { key: 'status', label: 'Trạng thái', render: (list) => list.status ?? '-' },
          { key: 'source', label: 'Nguồn', render: (list) => list.sourceType ?? '-' },
        ]}
        emptyLabel="Chưa có tệp người dùng."
        rows={lists}
      />
    </section>
  );
}
