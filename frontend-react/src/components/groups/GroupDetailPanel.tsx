import type { Group } from '../../types/crm';
import Card from '../ui/Card';

interface GroupDetailPanelProps {
  group: Group | null;
}

export default function GroupDetailPanel({ group }: GroupDetailPanelProps) {
  if (!group) return null;

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">{group.name ?? group.groupName ?? 'Nhóm Zalo'}</h2>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Thành viên</dt>
          <dd className="font-medium text-slate-900">{group.membersCount ?? group.totalMembers ?? 0}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Chủ nhóm</dt>
          <dd className="font-medium text-slate-900">{group.ownerName ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Hoạt động cuối</dt>
          <dd className="font-medium text-slate-900">{group.lastActivityAt ?? '-'}</dd>
        </div>
      </dl>
    </Card>
  );
}
