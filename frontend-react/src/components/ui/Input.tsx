import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={twMerge('w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600', className)} {...props} />;
}
