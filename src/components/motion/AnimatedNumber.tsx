"use client";

import { useEffect, useMemo, useState } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  value: string;
  className?: string;
};

function parseMetric(value: string) {
  const match = value.trim().match(/^([^\d-]*)([\d,.]+)(.*)$/);
  if (!match) return null;
  const raw = match[2].replace(/,/g, "");
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;
  return {
    prefix: match[1] ?? "",
    suffix: match[3] ?? "",
    target: numeric,
    decimals: raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0,
  };
}

export function AnimatedNumber({ value, className = "" }: Props) {
  const parsed = useMemo(() => parseMetric(value), [value]);
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!parsed || !inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const duration = 1100;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = parsed.target * eased;
      const formatted = parsed.decimals
        ? current.toFixed(parsed.decimals)
        : Math.round(current).toLocaleString("en-IN");
      setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setDisplay(value);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, parsed, reduced, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
