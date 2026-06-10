import type { ReactNode } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" data-testid="mobile-layout">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-semibold">ZaloCRM</span>
      </header>
      <main className="px-4 py-4">{children}</main>
      <ToastContainer />
    </div>
  );
}
