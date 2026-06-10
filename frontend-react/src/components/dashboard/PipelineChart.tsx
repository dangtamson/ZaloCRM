import { getCount, type PipelineItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface PipelineChartProps {
  data: PipelineItem[];
}

export default function PipelineChart({ data }: PipelineChartProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Pipeline</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.map((item) => (
          <li className="flex items-center justify-between" key={item.status ?? 'unknown'}>
            <span>{item.status ?? 'Chưa phân loại'}</span>
            <span className="font-medium">{getCount(item._count)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
