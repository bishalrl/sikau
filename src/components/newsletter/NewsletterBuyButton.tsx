"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  paymentStatus: string | null;
  communitySlug: string;
};

export function NewsletterBuyButton({ paymentStatus, communitySlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBuy() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/newsletter/orders", { method: "POST" });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to continue.");
      return;
    }

    router.push(data.redirectTo ?? "/newsletter/pay");
  }

  if (paymentStatus === "APPROVED") {
    return (
      <Button href={`/community/${communitySlug}`} size="lg">
        Open newsletter group
      </Button>
    );
  }

  if (paymentStatus === "PENDING") {
    return (
      <Button href="/newsletter/pay" size="lg" variant="outline">
        Complete payment
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="lg" onClick={handleBuy} disabled={loading}>
        {loading ? "Please wait…" : "Subscribe — pay & upload receipt"}
      </Button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
