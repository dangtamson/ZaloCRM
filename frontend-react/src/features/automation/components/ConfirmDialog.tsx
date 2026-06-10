interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ open, title, description, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="presentation">
      <section aria-modal="true" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" role="dialog">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onCancel} type="button">
            Hủy
          </button>
          <button className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500" onClick={onConfirm} type="button">
            Xác nhận
          </button>
        </div>
      </section>
    </div>
  );
}
