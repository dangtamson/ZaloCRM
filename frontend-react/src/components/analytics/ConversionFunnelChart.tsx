import type { ConversionFunnelData } from '../../types/analytics';
import Card from '../ui/Card';

interface ConversionFunnelChartProps {
  data: ConversionFunnelData | null;
}

export default function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Phễu chuyển đổi</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {(data?.stages ?? []).map((stage) => (
          <li className="flex items-center justify-between" key={stage.status}>
            <span>{stage.status}</span>
            <span className="font-medium">{stage.count} ({stage.rate}%)</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
