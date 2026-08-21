"use client";

import Link from "next/link";

type Props = {
  variant?: "dark" | "light";
};

/** Paid newsletter CTA — login + QR receipt flow (not free email signup). */
export function FooterNewsletter({ variant = "dark" }: Props) {
  const isDark = variant === "dark";

  return (
    <div className="footer-newsletter-cta space-y-3">
      <p className={`text-sm ${isDark ? "text-white/70" : "text-on-surface-variant"}`}>
        Private update group. Login, pay via QR, upload receipt — then read admin posts.
      </p>
      <Link
        href="/newsletter"
        className="footer-newsletter-btn inline-flex w-full items-center justify-center no-underline"
      >
        Subscribe
      </Link>
      <p className={`text-xs ${isDark ? "text-white/50" : "text-on-surface-variant"}`}>
        Same payment flow as ebooks. No instant free signup.
      </p>
    </div>
  );
}
