type Props = {
  value: number;
  className?: string;
  size?: "sm" | "md";
};

export function ProgressBar({ value, className = "", size = "md" }: Props) {
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={`w-full rounded-full bg-surface-container ${height} ${className}`}>
      <div
        className={`rounded-full bg-primary-container transition-all ${height}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
