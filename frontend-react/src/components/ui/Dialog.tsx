import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
}

export default function Dialog({ children, open, title }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">{children}</div>
    </div>
  );
}
