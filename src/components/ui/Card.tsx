import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = false }: Props) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/30 bg-surface-container-lowest card-shadow ${
        hover ? "premium-card" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
