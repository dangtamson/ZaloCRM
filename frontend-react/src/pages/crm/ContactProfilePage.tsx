import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchContactProfile } from '../../api/crm';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import StatusBadge from '../../components/crm/StatusBadge';
import FriendsTable from '../../components/friends/FriendsTable';
import Card from '../../components/ui/Card';
import type { ContactProfileResponse } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

function emptyProfile(id: string): ContactProfileResponse {
  return {
    contact: { id, displayName: 'Đang tải hồ sơ...', fullName: null, phone: null },
    friends: [],
    aggregateScore: 0,
    aggregateTags: [],
    primaryOwner: null,
  };
}

export default function ContactProfilePage() {
  const { id = '' } = useParams();
  const loader = useCallback(() => fetchContactProfile(id), [id]);
  const { data: profile, loading, error } = useCrmResource(loader, emptyProfile(id));
  const displayName = profile.contact.displayName ?? profile.contact.name ?? profile.contact.fullName ?? profile.contact.crmName ?? 'Hồ sơ khách hàng';

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Hồ sơ CRM tổng hợp theo contact và các nick Zalo liên quan." meta={`Contact ${id}`} title="Contact Profile" />
      <DataPanel error={error} loading={loading}>
        <Card className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{displayName}</h2>
              <p className="text-sm text-slate-600">{profile.contact.phone ?? 'Chưa có số điện thoại'}</p>
              <p className="text-sm text-slate-500">{profile.contact.email ?? profile.contact.addressLine ?? ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="blue" value={profile.contact.status ?? profile.contact.statusName} />
              <StatusBadge tone="orange" value={`Score ${profile.aggregateScore ?? profile.contact.leadScore ?? 0}`} />
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Tags</dt>
              <dd className="font-medium text-slate-900">{profile.aggregateTags?.join(', ') || '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Owner chính</dt>
              <dd className="font-medium text-slate-900">{profile.primaryOwner?.userName ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Nghề nghiệp</dt>
              <dd className="font-medium text-slate-900">{profile.contact.occupation ?? '-'}</dd>
            </div>
          </dl>
        </Card>
        <FriendsTable friends={profile.friends} />
      </DataPanel>
    </section>
  );
}
