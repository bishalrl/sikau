"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  rootMargin?: string;
  threshold?: number;
};

export function useInViewOnce<T extends Element = HTMLDivElement>(options: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin ?? "0px 0px -10% 0px",
        threshold: options.threshold ?? 0.2,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, options.rootMargin, options.threshold]);

  return { ref, inView };
}
