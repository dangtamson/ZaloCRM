import { CalendarCheck, Mail, MessageCircleWarning, Users, UserPlus, Wifi } from 'lucide-react';
import type { KpiData } from '../../types/dashboard';
import Card from '../ui/Card';

interface KpiCardsProps {
  kpi: KpiData | null;
}

const items: Array<{ key: keyof KpiData; label: string; tone: string; Icon: typeof Mail }> = [
  { key: 'messagesToday', label: 'Tin nhắn hôm nay', tone: 'bg-blue-50 text-blue-700 ring-blue-100', Icon: Mail },
  { key: 'messagesUnreplied', label: 'Chưa trả lời', tone: 'bg-amber-50 text-amber-700 ring-amber-100', Icon: MessageCircleWarning },
  { key: 'messagesUnread', label: 'Chưa đọc', tone: 'bg-rose-50 text-rose-700 ring-rose-100', Icon: Wifi },
  { key: 'appointmentsToday', label: 'Lịch hẹn hôm nay', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', Icon: CalendarCheck },
  { key: 'newContactsThisWeek', label: 'KH mới tuần này', tone: 'bg-cyan-50 text-cyan-700 ring-cyan-100', Icon: UserPlus },
  { key: 'totalContacts', label: 'Tổng khách hàng', tone: 'bg-violet-50 text-violet-700 ring-violet-100', Icon: Users },
];

export default function KpiCards({ kpi }: KpiCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map(({ Icon, ...item }) => (
        <Card className="min-h-[116px] p-4" key={item.key}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-normal text-slate-500">{item.label}</p>
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${item.tone}`}>
              <Icon size={17} />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">{kpi?.[item.key] ?? 0}</p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-slate-900" />
          </div>
        </Card>
      ))}
    </div>
  );
}
