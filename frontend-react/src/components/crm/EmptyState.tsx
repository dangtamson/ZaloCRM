interface EmptyStateProps {
  label: string;
}

export default function EmptyState({ label }: EmptyStateProps) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{label}</div>;
}
