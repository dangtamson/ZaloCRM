import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface EditorDrawerProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function EditorDrawer({ open, title, children, onClose }: EditorDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="presentation">
      <section aria-modal="true" className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl" role="dialog">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" onClick={onClose} title="Đóng" type="button">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}
