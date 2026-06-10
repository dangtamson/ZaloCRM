import { useCallback, useState } from 'react';
import { fetchGroups } from '../../api/crm';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import GroupDetailPanel from '../../components/groups/GroupDetailPanel';
import GroupList from '../../components/groups/GroupList';
import type { Group } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

export default function GroupsPage() {
  const loader = useCallback(() => fetchGroups(), []);
  const { data: groups, loading, error } = useCrmResource(loader, [] as Group[]);
  const [selected, setSelected] = useState<Group | null>(null);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Theo dõi nhóm Zalo, số lượng thành viên và trạng thái hoạt động." meta={`${groups.length} nhóm`} title="Groups" />
      <DataPanel error={error} loading={loading}>
        <GroupList groups={groups} onSelect={setSelected} />
      </DataPanel>
      <GroupDetailPanel group={selected} />
    </section>
  );
}
