import type { ReactNode } from 'react';

interface MenuProps {
  children: ReactNode;
}

export default function Menu({ children }: MenuProps) {
  return <div className="rounded-md border border-slate-200 bg-white shadow-sm">{children}</div>;
}
