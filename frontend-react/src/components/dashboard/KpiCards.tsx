import type { KpiData } from '../../types/dashboard';
import Card from '../ui/Card';

interface KpiCardsProps {
  kpi: KpiData | null;
}

const items: Array<{ key: keyof KpiData; label: string }> = [
  { key: 'messagesToday', label: 'Tin nhắn hôm nay' },
  { key: 'messagesUnreplied', label: 'Chưa trả lời' },
  { key: 'messagesUnread', label: 'Chưa đọc' },
  { key: 'appointmentsToday', label: 'Lịch hẹn hôm nay' },
  { key: 'newContactsThisWeek', label: 'KH mới tuần này' },
  { key: 'totalContacts', label: 'Tổng khách hàng' },
];

export default function KpiCards({ kpi }: KpiCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.key}>
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{kpi?.[item.key] ?? 0}</p>
        </Card>
      ))}
    </div>
  );
}
