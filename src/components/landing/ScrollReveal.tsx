"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const reveal = () => {
      document.querySelectorAll(".reveal").forEach((element) => {
        const top = element.getBoundingClientRect().top;
        if (top < window.innerHeight - 150) {
          element.classList.add("active");
        }
      });
    };

    reveal();
    window.addEventListener("scroll", reveal);
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  return null;
}
