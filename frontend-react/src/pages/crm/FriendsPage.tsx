import { useCallback, useMemo, useState } from 'react';
import { fetchFriends } from '../../api/crm';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import FriendsFilterBar from '../../components/friends/FriendsFilterBar';
import FriendsTable from '../../components/friends/FriendsTable';
import type { Friend } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

function friendText(friend: Friend): string {
  return [friend.displayName, friend.zaloDisplayName, friend.aliasInNick, friend.phone, friend.relationshipKind, friend.contact?.fullName].filter(Boolean).join(' ').toLowerCase();
}

export default function FriendsPage() {
  const loader = useCallback(() => fetchFriends(), []);
  const { data: friends, loading, error } = useCrmResource(loader, [] as Friend[]);
  const [query, setQuery] = useState('');
  const filteredFriends = useMemo(() => friends.filter((friend) => friendText(friend).includes(query.toLowerCase())), [friends, query]);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Danh sách bạn Zalo và quan hệ với khách hàng CRM." meta={`${filteredFriends.length} bạn`} title="Friends" />
      <div className="sm:max-w-sm">
        <FriendsFilterBar onChange={setQuery} value={query} />
      </div>
      <DataPanel error={error} loading={loading}>
        <FriendsTable friends={filteredFriends} />
      </DataPanel>
    </section>
  );
}
