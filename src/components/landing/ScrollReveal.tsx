"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.active)"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach((element) => element.classList.add("active"));
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      nodes().forEach((element) => element.classList.add("active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    const observeAll = () => {
      nodes().forEach((element) => observer.observe(element));
    };

    observeAll();

    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}
