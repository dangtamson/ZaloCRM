import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Card from '../components/ui/Card';

interface MessageReportRow {
  date: string;
  sent: number;
  received: number;
}

export default function ReportsPage() {
  const [rows, setRows] = useState<MessageReportRow[]>([]);

  useEffect(() => {
    let active = true;
    async function fetchReport(): Promise<void> {
      const { data } = await apiClient.get<{ data?: MessageReportRow[] } | MessageReportRow[]>('/reports/messages', {
        params: { from: '', to: '' },
      });
      if (active) {
        setRows(Array.isArray(data) ? data : data.data ?? []);
      }
    }
    void fetchReport();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">Reports</h1>
      <Card>
        <h2 className="text-base font-semibold text-slate-950">Tin nhắn</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {rows.map((row) => (
            <li className="flex items-center justify-between" key={row.date}>
              <span>{row.date}</span>
              <span>Gửi {row.sent} / Nhận {row.received}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
