import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import ConversionFunnelChart from '../components/analytics/ConversionFunnelChart';
import ReportBuilder from '../components/analytics/ReportBuilder';
import ResponseTimeChart from '../components/analytics/ResponseTimeChart';
import TeamLeaderboard from '../components/analytics/TeamLeaderboard';
import type { ConversionFunnelData, CustomReportResult, ResponseTimeData, SavedReport, TeamPerformanceData } from '../types/analytics';

function defaultFrom(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<ConversionFunnelData | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceData | null>(null);
  const [responseTime, setResponseTime] = useState<ResponseTimeData | null>(null);
  const [customResult] = useState<CustomReportResult | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom] = useState(defaultFrom);
  const [dateTo] = useState(defaultTo);

  useEffect(() => {
    let active = true;
    async function fetchAnalytics(): Promise<void> {
      setLoading(true);
      try {
        const params = { from: dateFrom, to: dateTo };
        const [funnelRes, teamRes, responseRes, savedRes] = await Promise.all([
          apiClient.get<ConversionFunnelData>('/analytics/conversion-funnel', { params }),
          apiClient.get<TeamPerformanceData>('/analytics/team-performance', { params }),
          apiClient.get<ResponseTimeData>('/analytics/response-time', { params }),
          apiClient.get<{ data?: SavedReport[] }>('/saved-reports'),
        ]);
        if (!active) return;
        setFunnel(funnelRes.data);
        setTeamPerformance(teamRes.data);
        setResponseTime(responseRes.data);
        setSavedReports(savedRes.data.data ?? []);
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchAnalytics();
    return () => {
      active = false;
    };
  }, [dateFrom, dateTo]);

  async function saveReport(name: string): Promise<void> {
    setLoading(true);
    try {
      const { data } = await apiClient.post<SavedReport>('/saved-reports', {
        name,
        type: 'custom',
        config: { metrics: [], groupBy: 'day', dateRange: { from: dateFrom, to: dateTo } },
      });
      setSavedReports((current) => [data, ...current]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Analytics</h1>
        {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ConversionFunnelChart data={funnel} />
        <ResponseTimeChart data={responseTime} />
      </div>
      <TeamLeaderboard data={teamPerformance} />
      <ReportBuilder loading={loading} onSave={saveReport} result={customResult} savedReports={savedReports} />
    </section>
  );
}
