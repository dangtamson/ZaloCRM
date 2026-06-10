import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import AppointmentChart from '../components/dashboard/AppointmentChart';
import KpiCards from '../components/dashboard/KpiCards';
import MessageVolumeChart from '../components/dashboard/MessageVolumeChart';
import PipelineChart from '../components/dashboard/PipelineChart';
import SourceChart from '../components/dashboard/SourceChart';
import type { AppointmentStatusItem, KpiData, MessageVolumeItem, PipelineItem, SourceItem } from '../types/dashboard';

type DashboardCollection<T> = T[] | { data?: T[] };
type CountedDashboardItem = { count?: number; _count?: { _all: number } | number };

function unwrapDashboardCollection<T>(payload: DashboardCollection<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

function normalizeCount<T extends CountedDashboardItem>(item: T): T {
  if (item._count !== undefined || item.count === undefined) return item;
  return { ...item, _count: item.count };
}

function normalizeDashboardCollection<T extends CountedDashboardItem>(payload: DashboardCollection<T>): T[] {
  return unwrapDashboardCollection(payload).map(normalizeCount);
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [messageVolume, setMessageVolume] = useState<MessageVolumeItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentStatusItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchDashboard(): Promise<void> {
      setLoading(true);
      try {
        const [kpiRes, volumeRes, pipelineRes, sourceRes, appointmentRes] = await Promise.all([
          apiClient.get<KpiData>('/dashboard/kpi'),
          apiClient.get<{ data?: MessageVolumeItem[] } | MessageVolumeItem[]>('/dashboard/message-volume'),
          apiClient.get<DashboardCollection<PipelineItem>>('/dashboard/pipeline'),
          apiClient.get<DashboardCollection<SourceItem>>('/dashboard/sources'),
          apiClient.get<DashboardCollection<AppointmentStatusItem>>('/dashboard/appointments'),
        ]);
        if (!active) return;
        setKpi(kpiRes.data);
        setMessageVolume(Array.isArray(volumeRes.data) ? volumeRes.data : volumeRes.data.data ?? []);
        setPipeline(normalizeDashboardCollection(pipelineRes.data));
        setSources(normalizeDashboardCollection(sourceRes.data));
        setAppointments(normalizeDashboardCollection(appointmentRes.data));
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Activity size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Tổng quan vận hành CRM, tin nhắn và lịch hẹn theo dữ liệu backend hiện tại.</p>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <RefreshCw className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} size={16} />
          {loading ? 'Đang tải dữ liệu' : 'Dữ liệu đã đồng bộ'}
        </div>
      </div>
      <KpiCards kpi={kpi} />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <MessageVolumeChart data={messageVolume} />
        <PipelineChart data={pipeline} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SourceChart data={sources} />
        <AppointmentChart data={appointments} />
      </div>
    </section>
  );
}
