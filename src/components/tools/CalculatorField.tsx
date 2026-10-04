type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
};

export function CalculatorField({
  label,
  value,
  onChange,
  min = 0,
  max = 100_000_000,
  step = 1,
  prefix,
  suffix,
}: Props) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-on-surface-variant">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-white px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {prefix ? <span className="text-sm text-on-surface-variant">{prefix}</span> : null}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent text-lg font-semibold text-on-background outline-none"
        />
        {suffix ? <span className="text-sm text-on-surface-variant">{suffix}</span> : null}
      </span>
    </label>
  );
}
