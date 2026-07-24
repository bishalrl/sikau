import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import { getCurrentSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="site-container py-xl">
      <div className="mx-auto max-w-lg">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Account Access</p>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">Login</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Access your learner dashboard, study pages, and admin tools.
          </p>
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
          <p className="mt-4 text-sm text-on-surface-variant">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-primary">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
