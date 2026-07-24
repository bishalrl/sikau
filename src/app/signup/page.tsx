import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/Card";
import { getCurrentSession } from "@/lib/session";

export default async function SignupPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="site-container py-xl">
      <div className="mx-auto max-w-lg">
        <Card className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Join Sikau Paisa</p>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">Create your account</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Register as a learner or instructor and manage your fintech education journey.
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
