"use client";

import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [spot, setSpot] = useState({ x: 50, y: 50, on: false });

  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`}
      onMouseMove={(event) => {
        if (reduced) return;
        if (window.matchMedia("(hover: none)").matches) return;
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        setSpot({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
          on: true,
        });
      }}
      onMouseLeave={() => setSpot((current) => ({ ...current, on: false }))}
      style={
        spot.on && !reduced
          ? ({
              "--spot-x": `${spot.x}%`,
              "--spot-y": `${spot.y}%`,
            } as CSSProperties)
          : undefined
      }
      data-active={spot.on && !reduced ? "true" : "false"}
    >
      {children}
    </div>
  );
}
