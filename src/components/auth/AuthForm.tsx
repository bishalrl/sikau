"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  mode: "login" | "signup";
};

const PENDING_SIGNUP_KEY = "sikau_pending_signup";

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LEARNER" | "INSTRUCTOR">("LEARNER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await response.json();

        // Always move to OTP screen when account exists/needs verification.
        if (response.ok || data.needsVerification) {
          sessionStorage.setItem(
            PENDING_SIGNUP_KEY,
            JSON.stringify({ email: email.toLowerCase(), password }),
          );
          router.push(
            `/verify-email?email=${encodeURIComponent(email.toLowerCase())}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
          );
          return;
        }

        throw new Error(data.error ?? "Unable to create account.");
      }

      const { signIn } = await import("next-auth/react");

      const checkResponse = await fetch("/api/otp/credentials-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const checkData = await checkResponse.json();

      if (checkData.needsVerification) {
        sessionStorage.setItem(
          PENDING_SIGNUP_KEY,
          JSON.stringify({ email: email.toLowerCase(), password }),
        );
        router.push(
          `/verify-email?email=${encodeURIComponent(email.toLowerCase())}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
        return;
      }

      if (!checkResponse.ok) {
        throw new Error(checkData.error ?? "Invalid email or password.");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error("Invalid email or password.");
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-on-background">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>

      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-on-background">Account Type</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "LEARNER" | "INSTRUCTOR")}
            className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          >
            <option value="LEARNER">Learner</option>
            <option value="INSTRUCTOR">Instructor</option>
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </Button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-outline-variant/40" />
        <span className="text-xs uppercase tracking-wide text-on-surface-variant">or</span>
        <span className="h-px flex-1 bg-outline-variant/40" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const { signIn, getProviders } = await import("next-auth/react");
            const providers = await getProviders();
            if (!providers?.google) {
              throw new Error(
                "Google login is not configured. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env, then restart the server.",
              );
            }
            await signIn("google", { callbackUrl });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to start Google sign-in.");
            setLoading(false);
          }
        }}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
