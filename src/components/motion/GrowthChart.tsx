"use client";

import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function GrowthChart({ className = "" }: { className?: string }) {
  const { ref, inView } = useInViewOnce<SVGSVGElement>({ threshold: 0.4 });
  const reduced = usePrefersReducedMotion();

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 48"
      className={`growth-chart ${inView || reduced ? "is-visible" : ""} ${className}`}
      aria-hidden="true"
    >
      <path
        className="growth-chart__line"
        d="M4 40 C 22 38, 28 28, 40 26 S 58 30, 70 18 S 92 10, 116 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="growth-chart__dot" cx="116" cy="8" r="3.5" fill="currentColor" />
    </svg>
  );
}
