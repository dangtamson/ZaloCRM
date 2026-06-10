import type { MessageVolumeItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface MessageVolumeChartProps {
  data: MessageVolumeItem[];
}

export default function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Tin nhắn theo ngày</h2>
      <div className="mt-4 space-y-2 text-sm">
        {data.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.date}>
            <span>{item.date}</span>
            <span className="text-slate-600">Gửi {item.sent} / Nhận {item.received}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
