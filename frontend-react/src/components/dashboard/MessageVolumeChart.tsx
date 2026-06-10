import type { MessageVolumeItem } from '../../types/dashboard';
import Card from '../ui/Card';

interface MessageVolumeChartProps {
  data: MessageVolumeItem[];
}

export default function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  const max = Math.max(...data.map((item) => item.sent + item.received), 1);

  return (
    <Card className="min-h-[300px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Tin nhắn theo ngày</h2>
          <p className="mt-1 text-xs text-slate-500">Gửi và nhận trong khoảng thời gian gần đây</p>
        </div>
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{data.length} ngày</span>
      </div>
      {data.length === 0 ? <p className="mt-10 text-sm text-slate-500">Chưa có dữ liệu tin nhắn.</p> : null}
      <div className="mt-5 space-y-3 text-sm">
        {data.map((item) => (
          <div className="grid gap-2 sm:grid-cols-[112px_1fr_140px]" key={item.date}>
            <span className="font-medium text-slate-700">{item.date}</span>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-blue-600" style={{ width: `${Math.max(4, (item.sent / max) * 100)}%` }} />
              <div className="bg-cyan-400" style={{ width: `${Math.max(4, (item.received / max) * 100)}%` }} />
            </div>
            <span className="text-slate-600 sm:text-right">Gửi {item.sent} / Nhận {item.received}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Gửi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          Nhận
        </span>
      </div>
    </Card>
  );
}
