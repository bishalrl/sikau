"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "ghost" | "gold" | "outline";

export function EnrollButton({
  courseSlug,
  label = "Enroll Now",
  size = "sm",
  variant = "primary",
  className = "",
  returnTo,
}: {
  courseSlug: string;
  label?: string;
  size?: Size;
  variant?: Variant;
  className?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug }),
    });
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      router.push(data.redirectTo ?? `/payment/${courseSlug}`);
      router.refresh();
      return;
    }

    if (response.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(returnTo || `/learn/${courseSlug}`)}`);
      return;
    }

    setError(data.error ?? "Unable to enroll. Please try again.");
  }

  return (
    <div className={className}>
      <Button type="button" size={size} variant={variant} onClick={handleClick} disabled={loading} className="w-full">
        {loading ? "Redirecting..." : label}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
