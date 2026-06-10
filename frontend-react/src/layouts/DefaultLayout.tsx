import type { ReactNode } from 'react';
import TopNav from '../components/navigation/TopNav';
import ToastContainer from '../components/ui/ToastContainer';

interface DefaultLayoutProps {
  children: ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" data-testid="default-layout">
      <TopNav />
      <main className="px-6 py-6">{children}</main>
      <ToastContainer />
    </div>
  );
}
