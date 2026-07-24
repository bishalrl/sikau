"use client";

import { useState } from "react";

type Props = {
  variant?: "dark" | "light";
};

export function FooterNewsletter({ variant = "dark" }: Props) {
  const [email, setEmail] = useState("");

  const inputClass =
    variant === "dark"
      ? "border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-fixed focus:ring-primary-fixed/30"
      : "border-outline-variant/50 bg-surface-container-low text-on-background placeholder:text-on-surface-variant focus:border-primary focus:ring-primary/20";

  return (
    <form
      className="footer-newsletter-form"
      onSubmit={(e) => {
        e.preventDefault();
        setEmail("");
      }}
    >
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
      />
      <button type="submit" className="footer-newsletter-btn">
        Subscribe
      </button>
    </form>
  );
}
