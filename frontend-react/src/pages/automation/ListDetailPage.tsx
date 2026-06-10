import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCustomerList, fetchCustomerListEntries } from '../../api/automation';
import AutomationPageHeader from '../../components/automation/AutomationPageHeader';
import AutomationTable from '../../components/automation/AutomationTable';
import type { CustomerListEntry, CustomerListSummary } from '../../types/automation';

export default function ListDetailPage() {
  const { id = '' } = useParams();
  const [list, setList] = useState<CustomerListSummary | null>(null);
  const [entries, setEntries] = useState<CustomerListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, entryResult] = await Promise.all([fetchCustomerList(id), fetchCustomerListEntries(id)]);
      setList(listResult);
      setEntries(entryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được tệp người dùng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-4">
      <Link className="text-sm font-medium text-blue-700 hover:text-blue-900" to="/automation/bot/lists">Quay lại tệp người dùng</Link>
      <AutomationPageHeader description="Bảng dòng tệp người dùng cho automation." meta={loading ? 'Đang tải...' : `${entries.length} dòng`} title={list?.name ?? 'BotAuto.ListDetail'} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <AutomationTable
        columns={[
          { key: 'name', label: 'Khách hàng', render: (entry) => <span className="font-medium text-slate-950">{entry.displayName ?? entry.name ?? entry.id}</span> },
          { key: 'phone', label: 'Điện thoại', render: (entry) => entry.phone ?? '-' },
          { key: 'status', label: 'Trạng thái', render: (entry) => entry.status ?? '-' },
          { key: 'note', label: 'Ghi chú', render: (entry) => entry.note ?? '-' },
        ]}
        emptyLabel="Tệp này chưa có dòng."
        rows={entries}
      />
    </section>
  );
}
