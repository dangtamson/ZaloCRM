import { getCount, type SourceItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface SourceChartProps {
  data: SourceItem[];
}

export default function SourceChart({ data }: SourceChartProps) {
  const max = Math.max(...data.map((item) => getCount(item._count ?? item.count)), 1);

  return (
    <Card className="min-h-[260px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Nguồn khách hàng</h2>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{data.length} nguồn</span>
      </div>
      {data.length === 0 ? <p className="mt-8 text-sm text-slate-500">Chưa có dữ liệu nguồn khách hàng.</p> : null}
      <ul className="mt-4 space-y-3 text-sm">
        {data.map((item) => (
          <li className="space-y-1.5" key={item.source}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-slate-700">{item.source}</span>
              <span className="font-semibold text-slate-950">{getCount(item._count ?? item.count)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.max(6, (getCount(item._count ?? item.count) / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
