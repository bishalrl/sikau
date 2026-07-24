import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "default" | "gold" | "emerald" | "primary";
  className?: string;
};

const variants = {
  default: "bg-surface-container text-on-surface-variant",
  gold: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  emerald: "border border-primary/20 bg-primary-container/10 text-primary",
  primary: "border border-primary/20 bg-primary-container/10 text-primary",
};

export function Badge({ children, variant = "default", className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
