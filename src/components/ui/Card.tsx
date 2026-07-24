import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = false }: Props) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/30 bg-surface-container-lowest card-shadow ${hover ? "transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:card-shadow-lg" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
