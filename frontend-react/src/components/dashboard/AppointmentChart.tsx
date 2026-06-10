import { getCount, type AppointmentStatusItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface AppointmentChartProps {
  data: AppointmentStatusItem[];
}

export default function AppointmentChart({ data }: AppointmentChartProps) {
  const max = Math.max(...data.map((item) => getCount(item._count ?? item.count)), 1);

  return (
    <Card className="min-h-[260px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Lịch hẹn</h2>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{data.length} nhóm</span>
      </div>
      {data.length === 0 ? <p className="mt-8 text-sm text-slate-500">Chưa có dữ liệu lịch hẹn.</p> : null}
      <ul className="mt-4 space-y-3 text-sm">
        {data.map((item) => (
          <li className="space-y-1.5" key={item.status}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-slate-700">{item.status}</span>
              <span className="font-semibold text-slate-950">{getCount(item._count ?? item.count)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${Math.max(6, (getCount(item._count ?? item.count) / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
