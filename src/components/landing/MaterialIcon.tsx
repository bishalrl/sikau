type Props = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
};

export function MaterialIcon({ name, className = "", filled = false, size }: Props) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "material-symbols-filled" : ""} ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}
