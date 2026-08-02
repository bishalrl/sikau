import { Suspense } from "react";
import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { Card } from "@/components/ui/Card";
import { getCurrentSession } from "@/lib/session";

export default async function VerifyEmailPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/");
  }

  return (
    <div className="site-container py-xl">
      <div className="mx-auto max-w-lg">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Email verification</p>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">Enter your OTP</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            We sent a 6-digit code to your email. Enter it below to finish creating your account.
          </p>
          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-on-surface-variant">Loading...</p>}>
              <VerifyEmailForm />
            </Suspense>
          </div>
        </Card>
      </div>
    </div>
  );
}
