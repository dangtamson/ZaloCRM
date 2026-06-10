import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCustomerTimeline } from '../../api/crm';
import CrmPageHeader from '../../components/crm/CrmPageHeader';
import DataPanel from '../../components/crm/DataPanel';
import EmptyState from '../../components/crm/EmptyState';
import Card from '../../components/ui/Card';
import type { TimelineItem } from '../../types/crm';
import { useCrmResource } from './useCrmResource';

function itemTitle(item: TimelineItem): string {
  return item.data?.action ?? item.data?.content ?? item.data?.category ?? item.type ?? 'Hoạt động';
}

export default function CustomerActivityLogPage() {
  const { id = '' } = useParams();
  const loader = useCallback(() => fetchCustomerTimeline(id), [id]);
  const { data: items, loading, error } = useCrmResource(loader, [] as TimelineItem[]);

  return (
    <section className="space-y-4">
      <CrmPageHeader description="Timeline hợp nhất ghi chú và activity của khách hàng." meta={`Customer ${id}`} title="Customer Activity" />
      <DataPanel error={error} loading={loading}>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={`${item.createdAt ?? 'timeline'}-${index}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-950">{itemTitle(item)}</h2>
                    <p className="text-sm text-slate-500">{item.data?.user?.fullName ?? item.type ?? 'system'}</p>
                  </div>
                  <time className="text-xs text-slate-500">{item.createdAt ?? '-'}</time>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState label="Chưa có activity." />
        )}
      </DataPanel>
    </section>
  );
}
