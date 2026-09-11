"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  ebookSlug: string;
  label: string;
  purchaseType?: "SOLO_EBOOK" | "COMMUNITY_BUNDLE";
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  className?: string;
};

export function EbookBuyButton({
  ebookSlug,
  label,
  purchaseType = "SOLO_EBOOK",
  size = "lg",
  variant = "primary",
  className = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    const payHint =
      purchaseType === "COMMUNITY_BUNDLE"
        ? `/ebooks/${ebookSlug}/pay?type=community`
        : `/ebooks/${ebookSlug}/pay?type=solo`;

    const response = await fetch("/api/ebooks/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ebookSlug, purchaseType }),
    });
    const data = await response.json();
    setLoading(false);

    if (response.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(payHint)}`);
      return;
    }

    if (!response.ok) {
      setError(
        response.status === 404
          ? "This ebook is not published yet. Publish it in Admin → Ebooks."
          : (data.error ?? "Unable to continue."),
      );
      return;
    }

    if (data.paymentStatus === "APPROVED") {
      router.push(`/ebooks/${ebookSlug}/read`);
      return;
    }

    router.push(data.redirectTo ?? payHint);
  }

  return (
    <div className={className}>
      <Button type="button" size={size} variant={variant} onClick={handleClick} disabled={loading} className="w-full">
        {loading ? "Please wait..." : label}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
