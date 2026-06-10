import type { ReactNode } from 'react';
import Card from '../ui/Card';

interface DataPanelProps {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}

export default function DataPanel({ loading, error, children }: DataPanelProps) {
  if (error) {
    return <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>;
  }

  return (
    <div className="space-y-3">
      {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
      {children}
    </div>
  );
}
