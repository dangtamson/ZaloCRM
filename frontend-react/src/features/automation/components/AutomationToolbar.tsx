import type { ReactNode } from 'react';
import { Plus, Search } from 'lucide-react';

interface AutomationToolbarProps {
  searchPlaceholder: string;
  createLabel: string;
  filters?: ReactNode;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}

export default function AutomationToolbar({ searchPlaceholder, createLabel, filters, onSearchChange, onCreate }: AutomationToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500" onClick={onCreate} type="button">
          <Plus size={16} />
          {createLabel}
        </button>
      </div>
    </div>
  );
}
