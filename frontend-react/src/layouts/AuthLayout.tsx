import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10" data-testid="auth-layout">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
    </main>
  );
}
