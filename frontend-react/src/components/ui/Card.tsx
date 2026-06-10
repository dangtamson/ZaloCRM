import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)} {...props} />;
}
