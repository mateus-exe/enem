interface Props {
  label: string;
  value: string | number;
  sub?: string;
}

export default function MetricCard({ label, value, sub }: Props) {
  return (
    <div className="bg-bg-primary border border-border-soft rounded-xl px-5 py-4 space-y-1">
      <p className="text-xs text-text-meta font-medium uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-text-main tabular-nums">{value}</p>
      {sub && <p className="text-xs text-text-meta">{sub}</p>}
    </div>
  );
}
