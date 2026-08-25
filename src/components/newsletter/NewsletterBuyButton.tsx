"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  paymentStatus: string | null;
  communitySlug: string;
  planCode?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  className?: string;
};

export function NewsletterBuyButton({
  paymentStatus,
  communitySlug,
  planCode = "MONTHLY",
  label,
  size = "lg",
  variant = "primary",
  className = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const payPath = `/newsletter/pay?plan=${encodeURIComponent(planCode)}`;

  async function handleBuy() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/newsletter/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const data = await response.json();
    setLoading(false);

    if (response.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(payPath)}`);
      return;
    }

    if (!response.ok) {
      setError(data.error ?? "Unable to continue.");
      return;
    }

    router.push(data.redirectTo ?? payPath);
  }

  if (paymentStatus === "APPROVED") {
    return (
      <div className={className}>
        <Button href={`/community/${communitySlug}`} size={size} variant={variant} className="w-full">
          Open group
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button type="button" size={size} variant={variant} onClick={handleBuy} disabled={loading} className="w-full">
        {loading ? "Please wait…" : label ?? "Join NEPSE Weekly"}
      </Button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
