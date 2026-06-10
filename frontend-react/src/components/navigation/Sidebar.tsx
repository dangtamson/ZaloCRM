import type { ReactNode } from 'react';

interface SidebarProps {
  children?: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return <aside className="w-64 border-r border-slate-200 bg-white">{children}</aside>;
}
