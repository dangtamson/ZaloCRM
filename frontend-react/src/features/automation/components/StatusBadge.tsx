import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-blue-50 text-blue-700',
};

export default function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={twMerge('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', tones[tone])}>{children}</span>;
}
