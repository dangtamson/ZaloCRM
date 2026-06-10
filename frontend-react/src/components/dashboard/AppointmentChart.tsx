import { getCount, type AppointmentStatusItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface AppointmentChartProps {
  data: AppointmentStatusItem[];
}

export default function AppointmentChart({ data }: AppointmentChartProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Lịch hẹn</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.map((item) => (
          <li className="flex items-center justify-between" key={item.status}>
            <span>{item.status}</span>
            <span className="font-medium">{getCount(item._count)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
