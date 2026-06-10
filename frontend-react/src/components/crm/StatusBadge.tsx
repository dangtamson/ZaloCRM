import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  value?: string | null;
  tone?: 'blue' | 'green' | 'orange' | 'slate';
}

const tones = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  orange: 'bg-amber-50 text-amber-700 ring-amber-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function StatusBadge({ value, tone = 'slate' }: StatusBadgeProps) {
  if (!value) return null;
  return <span className={twMerge('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1', tones[tone])}>{value}</span>;
}
