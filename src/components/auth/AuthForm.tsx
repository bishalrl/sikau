"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to create account.");
        }
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
    </form>
  );
}
