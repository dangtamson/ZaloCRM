import { useCallback } from 'react';
import { fetchStuckLeads } from '../../api/crm';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import FriendsTable from '../../components/friends/FriendsTable';
import type { Friend } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

export default function StuckLeadsPage() {
  const loader = useCallback(() => fetchStuckLeads(), []);
  const { data: leads, loading, error } = useCrmResource(loader, [] as Friend[]);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Lead quá lâu không có tương tác hoặc kẹt ở một giai đoạn CRM." meta={`${leads.length} lead`} title="Stuck Leads" />
      <DataPanel error={error} loading={loading}>
        <FriendsTable friends={leads} />
      </DataPanel>
    </section>
  );
}
