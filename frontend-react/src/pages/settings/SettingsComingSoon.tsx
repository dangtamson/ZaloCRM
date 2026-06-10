interface SettingsComingSoonProps {
  title: string;
}

export default function SettingsComingSoon({ title }: SettingsComingSoonProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">Trang này sẽ được port ở bước migration tương ứng.</p>
    </section>
  );
}
