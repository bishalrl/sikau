"use client";

import { useState } from "react";

type Props = {
  variant?: "dark" | "light";
};

export function FooterNewsletter({ variant = "dark" }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inputClass =
    variant === "dark"
      ? "border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-fixed focus:ring-primary-fixed/30"
      : "border-outline-variant/50 bg-surface-container-low text-on-background placeholder:text-on-surface-variant focus:border-primary focus:ring-primary/20";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to subscribe.");
      }
      setMessage(data.message ?? "Subscribed successfully.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to subscribe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="footer-newsletter-form" onSubmit={handleSubmit}>
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className={`footer-newsletter-input ${inputClass}`}
        autoComplete="email"
        disabled={loading}
      />
      <button type="submit" className="footer-newsletter-btn" disabled={loading}>
        {loading ? "..." : "Subscribe"}
      </button>
      {message && <p className="mt-2 w-full text-sm text-primary">{message}</p>}
      {error && <p className="mt-2 w-full text-sm text-red-500">{error}</p>}
    </form>
  );
}
