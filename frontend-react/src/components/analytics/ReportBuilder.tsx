import { useState, type FormEvent } from 'react';
import type { CustomReportResult, SavedReport } from '../../types/analytics';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';

interface ReportBuilderProps {
  result: CustomReportResult | null;
  savedReports: SavedReport[];
  loading: boolean;
  onSave: (name: string) => Promise<void>;
}

export default function ReportBuilder({ loading, onSave, result, savedReports }: ReportBuilderProps) {
  const [name, setName] = useState('');

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!name.trim()) return;
    await onSave(name.trim());
    setName('');
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">Báo cáo tùy chỉnh</h2>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSave}>
        <label className="flex-1 space-y-1 text-sm font-medium text-slate-700">
          <span>Tên báo cáo</span>
          <Input onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <Button className="self-end" disabled={loading} type="submit">
          Lưu báo cáo
        </Button>
      </form>
      {result ? <p className="mt-4 text-sm text-slate-600">{result.labels.length} nhãn báo cáo</p> : null}
      <ul className="mt-4 space-y-2 text-sm">
        {savedReports.map((report) => (
          <li className="rounded-md bg-slate-50 px-3 py-2" key={report.id}>
            {report.name}
          </li>
        ))}
      </ul>
    </Card>
  );
}
