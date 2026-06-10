import type { ReactNode } from 'react';

interface AutomationPageHeaderProps {
  title: string;
  description: string;
  meta?: ReactNode;
}

export default function AutomationPageHeader({ title, description, meta }: AutomationPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {meta ? <div className="text-sm text-slate-500">{meta}</div> : null}
    </div>
  );
}
