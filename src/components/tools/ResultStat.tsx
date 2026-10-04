type Props = {
  label: string;
  value: string;
  emphasize?: boolean;
};

export function ResultStat({ label, value, emphasize = false }: Props) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        emphasize ? "bg-primary text-white" : "bg-surface-container-low text-on-background"
      }`}
    >
      <p className={`text-sm ${emphasize ? "text-white/80" : "text-on-surface-variant"}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${emphasize ? "text-white" : "text-on-background"}`}>
        {value}
      </p>
    </div>
  );
}
