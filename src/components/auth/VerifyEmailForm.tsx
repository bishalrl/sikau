"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

const PENDING_SIGNUP_KEY = "sikau_pending_signup";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = (searchParams.get("email") ?? "").toLowerCase();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Enter the 6-digit code sent to your email.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as { email?: string; password?: string };
      if (pending.email && !email) setEmail(pending.email);
      if (pending.password) setPassword(pending.password);
    } catch {
      // ignore
    }
  }, [email]);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to verify code.");
      }

      sessionStorage.removeItem(PENDING_SIGNUP_KEY);

      if (password) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });
        if (!result?.error) {
          router.push(result?.url ?? callbackUrl);
          router.refresh();
          return;
        }
      }

      setMessage("Email verified successfully. You can log in now.");
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setResending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to resend code.");
      }
      setMessage(data.message ?? "A new code was sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">OTP code</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="6-digit code"
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 tracking-[0.3em]"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-primary">{message}</p>}

      <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
        {loading ? "Verifying..." : "Verify & continue"}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || !email}
        className="w-full text-sm font-semibold text-primary disabled:opacity-50"
      >
        {resending ? "Sending..." : "Resend OTP"}
      </button>

      <p className="text-center text-sm text-on-surface-variant">
        Already verified?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Login
        </Link>
      </p>
    </form>
  );
}
