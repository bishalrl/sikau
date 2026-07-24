"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function EbookActionButton({
  ebookSlug,
  isFree,
  approved,
  hasContent = true,
  filePath,
  size = "md",
  className = "",
}: {
  ebookSlug: string;
  isFree: boolean;
  approved: boolean;
  hasContent?: boolean;
  filePath?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (approved) {
      router.push(`/ebooks/${ebookSlug}/read`);
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch("/api/ebooks/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ebookSlug }),
    });
    const data = await response.json();
    setLoading(false);

    if (response.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/ebooks/${ebookSlug}/read`)}`);
      return;
    }

    if (!response.ok) {
      setError(data.error ?? "Unable to continue.");
      return;
    }

    if (data.paymentStatus === "APPROVED") {
      router.push(`/ebooks/${ebookSlug}/read`);
      router.refresh();
      return;
    }

    router.push(data.redirectTo ?? `/ebooks/${ebookSlug}/pay`);
  }

  return (
    <div className={className}>
      <Button type="button" size={size} onClick={handleClick} disabled={loading} className="w-full">
        {loading
          ? "Please wait..."
          : approved
            ? hasContent
              ? "Start Reading"
              : filePath
                ? "Open Ebook"
                : "Start Reading"
            : isFree
              ? "Read Free Ebook"
              : "Buy & Read"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
