import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import { getCurrentSession } from "@/lib/session";

export default async function SignupPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <div className="site-container py-xl">
      <div className="mx-auto max-w-lg">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Join Sikau Paisa</p>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">Create your account</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Create an account with your email and password. We will send a 6-digit OTP to verify your email.
          </p>
          <div className="mt-6">
            <AuthForm mode="signup" />
          </div>
          <p className="mt-4 text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
