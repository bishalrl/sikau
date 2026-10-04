"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const withArrow = className.includes("btn-arrow");
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className}
    >
      {withArrow ? (
        <>
          <span>Logout</span>
          <span className="btn-arrow__icon" aria-hidden="true">
            →
          </span>
        </>
      ) : (
        "Logout"
      )}
    </button>
  );
}
