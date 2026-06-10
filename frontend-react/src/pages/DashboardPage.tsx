import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import AppointmentChart from '../components/dashboard/AppointmentChart';
import KpiCards from '../components/dashboard/KpiCards';
import MessageVolumeChart from '../components/dashboard/MessageVolumeChart';
import PipelineChart from '../components/dashboard/PipelineChart';
import SourceChart from '../components/dashboard/SourceChart';
import type { AppointmentStatusItem, KpiData, MessageVolumeItem, PipelineItem, SourceItem } from '../types/dashboard';

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
          apiClient.get<PipelineItem[]>('/dashboard/pipeline'),
          apiClient.get<SourceItem[]>('/dashboard/sources'),
          apiClient.get<AppointmentStatusItem[]>('/dashboard/appointments'),
        ]);
        if (!active) return;
        setKpi(kpiRes.data);
        setMessageVolume(Array.isArray(volumeRes.data) ? volumeRes.data : volumeRes.data.data ?? []);
        setPipeline(pipelineRes.data);
        setSources(sourceRes.data);
        setAppointments(appointmentRes.data);
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
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
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
