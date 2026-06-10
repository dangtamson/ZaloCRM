import { getCount, type SourceItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface SourceChartProps {
  data: SourceItem[];
}

export default function SourceChart({ data }: SourceChartProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Nguồn khách hàng</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.map((item) => (
          <li className="flex items-center justify-between" key={item.source}>
            <span>{item.source}</span>
            <span className="font-medium">{getCount(item._count)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
