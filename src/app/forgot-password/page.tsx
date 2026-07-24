import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card } from "@/components/ui/Card";
import { getCurrentSession } from "@/lib/session";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/ebooks");
  }

  return (
    <div className="site-container py-xl">
      <div className="mx-auto max-w-lg">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Account Access</p>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">Forgot password</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Enter your account email and choose a new password.
          </p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
