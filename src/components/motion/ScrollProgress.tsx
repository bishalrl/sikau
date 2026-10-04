"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const next = max > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / max) * 100)) : 0;
      setProgress(next);
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress__bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
