import { Search } from 'lucide-react';

interface GlobalSearchProps {
  className?: string;
}

export default function GlobalSearch({ className = '' }: GlobalSearchProps) {
  return (
    <button
      className={`hidden items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 md:inline-flex ${className}`}
      title="Tìm kiếm"
      type="button"
    >
      <Search size={14} />
      Search
    </button>
  );
}
