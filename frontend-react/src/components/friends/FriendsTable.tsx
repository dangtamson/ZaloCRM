import type { Friend } from '../../types/crm';
import EmptyState from '../crm/EmptyState';
import StatusBadge from '../crm/StatusBadge';
import Card from '../ui/Card';

interface FriendsTableProps {
  friends: Friend[];
}

function displayName(friend: Friend): string {
  return friend.displayName ?? friend.zaloDisplayName ?? friend.aliasInNick ?? friend.contact?.fullName ?? friend.contact?.crmName ?? 'Bạn Zalo';
}

export default function FriendsTable({ friends }: FriendsTableProps) {
  if (!friends.length) return <EmptyState label="Chưa có bạn Zalo phù hợp." />;

  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Tên Zalo</th>
            <th className="px-4 py-3 font-semibold">Quan hệ</th>
            <th className="px-4 py-3 font-semibold">Khách hàng</th>
            <th className="px-4 py-3 font-semibold">Tin nhắn</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {friends.map((friend) => (
            <tr key={friend.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-950">{displayName(friend)}</div>
                <div className="text-xs text-slate-500">{friend.phone ?? friend.zaloAccount?.displayName ?? '-'}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone="green" value={friend.relationshipKind ?? friend.friendshipStatus} />
              </td>
              <td className="px-4 py-3 text-slate-700">{friend.contact?.fullName ?? friend.contact?.crmName ?? '-'}</td>
              <td className="px-4 py-3 text-slate-700">{(friend.totalInbound ?? 0) + (friend.totalOutbound ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
