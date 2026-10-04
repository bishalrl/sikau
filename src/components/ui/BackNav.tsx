"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  /** Safe parent route when browser history is unavailable or unsafe. */
  href: string;
  label: string;
  className?: string;
  icon?: ReactNode;
  /** When false, always navigates to href (avoids pay/login redirect loops). */
  preferHistory?: boolean;
};

const HISTORY_TRAPS = ["/pay", "/login", "/signup", "/verify-email", "/forgot-password"];

function canUseHistoryBack(referrer: string, currentPath: string) {
  try {
    const ref = new URL(referrer);
    if (ref.origin !== window.location.origin) return false;
    if (ref.pathname === currentPath) return false;
    if (HISTORY_TRAPS.some((trap) => ref.pathname.includes(trap))) return false;
    return true;
  } catch {
    return false;
  }
}

export function BackNav({
  href,
  label,
  className,
  icon,
  preferHistory = true,
}: Props) {
  const router = useRouter();
  const text = label.startsWith("←") ? label : `← ${label}`;

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (!preferHistory || typeof window === "undefined") return;
        const referrer = document.referrer;
        if (!referrer || !canUseHistoryBack(referrer, window.location.pathname)) return;
        event.preventDefault();
        router.back();
      }}
    >
      {icon}
      {icon ? <span>{text.replace(/^←\s*/, "")}</span> : text}
    </Link>
  );
}
