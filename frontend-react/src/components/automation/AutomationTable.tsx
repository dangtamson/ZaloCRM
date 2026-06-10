import type { ReactNode } from 'react';
import Card from '../ui/Card';

export interface AutomationTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

interface AutomationTableProps<T extends { id: string }> {
  rows: T[];
  columns: Array<AutomationTableColumn<T>>;
  emptyLabel: string;
}

export default function AutomationTable<T extends { id: string }>({ rows, columns, emptyLabel }: AutomationTableProps<T>) {
  if (!rows.length) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{emptyLabel}</div>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-semibold" key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr className="hover:bg-slate-50" key={row.id}>
              {columns.map((column) => (
                <td className="px-4 py-3 text-slate-700" key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
