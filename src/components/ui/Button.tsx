import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "btn-arrow emerald-gradient text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.35)]",
  secondary: "bg-secondary text-white hover:opacity-90",
  outline:
    "border border-primary bg-transparent text-primary hover:bg-primary/5 transition-[background,border-color,color]",
  ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container",
  gold: "bg-tertiary-container text-on-tertiary-container hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-[15px] rounded-xl font-semibold",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
  arrow?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  arrow = false,
  type = "button",
  ...props
}: Props) {
  const classes = `inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`;
  const content = arrow ? (
    <>
      <span>{children}</span>
      <span className="btn-arrow__icon" aria-hidden="true">
        →
      </span>
    </>
  ) : (
    children
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}
