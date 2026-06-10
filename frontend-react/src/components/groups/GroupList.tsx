import type { Group } from '../../types/crm';
import EmptyState from '../crm/EmptyState';
import Card from '../ui/Card';

interface GroupListProps {
  groups: Group[];
  onSelect: (group: Group) => void;
}

function groupName(group: Group): string {
  return group.name ?? group.groupName ?? 'Nhóm Zalo';
}

function memberCount(group: Group): number {
  return group.membersCount ?? group.totalMembers ?? 0;
}

export default function GroupList({ groups, onSelect }: GroupListProps) {
  if (!groups.length) return <EmptyState label="Chưa có nhóm Zalo." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {groups.map((group) => (
        <button className="text-left" key={group.id} onClick={() => onSelect(group)}>
          <Card className="h-full hover:border-blue-300 hover:shadow-md">
            <h2 className="font-semibold text-slate-950">{groupName(group)}</h2>
            <p className="mt-1 text-sm text-slate-600">{memberCount(group)} thành viên</p>
            <p className="mt-3 text-xs text-slate-500">{group.ownerName ?? 'Chưa có chủ nhóm'}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
