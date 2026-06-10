import type { ResponseTimeData } from '../../types/analytics';
import Card from '../ui/Card';

interface ResponseTimeChartProps {
  data: ResponseTimeData | null;
}

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return '-';
  if (seconds < 60) return `${seconds} giây`;
  return `${Math.floor(seconds / 60)} phút ${seconds % 60} giây`;
}

export default function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Thời gian trả lời</h2>
      <p className="mt-3 text-sm text-slate-600">Trung bình: {formatSeconds(data?.overall ?? null)}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {(data?.daily ?? []).map((item) => (
          <li className="flex items-center justify-between" key={item.date}>
            <span>{item.date}</span>
            <span>{formatSeconds(item.avgSeconds)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
