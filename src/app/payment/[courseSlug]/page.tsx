import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReceiptUploadForm } from "@/components/payment/ReceiptUploadForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCourseBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const session = await getCurrentSession();
  const { courseSlug } = await params;

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/payment/${courseSlug}`)}`);
  }

  const course = await getCourseBySlug(courseSlug, session.user.id);
  if (!course) {
    notFound();
  }

  if (course.priceNpr <= 0) {
    redirect(`/study/${course.slug}`);
  }

  const enrollment = Array.isArray(course.enrollments) ? course.enrollments[0] : null;
  const payment =
    enrollment && "payment" in enrollment
      ? ((enrollment as { payment?: { receiptPath: string | null } | null }).payment ?? null)
      : null;
  const status = enrollment?.paymentStatus ?? null;
  const hasReceipt = Boolean(payment?.receiptPath);

  if (status === "APPROVED") {
    redirect(`/study/${course.slug}`);
  }

  return (
    <div className="site-container py-xl">
      <div className="mb-6">
        <Link href="/learn" className="text-sm font-medium text-primary">
          ← Back to courses
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Manual Payment</p>
            <Badge variant={status === "REJECTED" ? "default" : "emerald"}>
              {status === "REJECTED"
                ? "Rejected — re-upload receipt"
                : hasReceipt
                  ? "Awaiting admin approval"
                  : "Pay, then upload receipt"}
            </Badge>
          </div>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">{course.title}</h1>
          <p className="mt-2 text-on-surface-variant">
            {course.paymentInstructions ??
              "Scan the QR below, pay the listed amount, then upload a clear receipt photo or PDF."}
          </p>

          <div className="mt-6 rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-low p-8 text-center">
            {course.paymentQrPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.paymentQrPath}
                alt={`${course.title} payment QR`}
                className="mx-auto h-72 w-72 rounded-2xl object-contain"
              />
            ) : (
              <div>
                <p className="text-sm font-semibold text-on-background">QR coming soon</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Pay using the bank / wallet instructions provided by the academy, then upload your receipt.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-on-surface-variant">Amount due</p>
              <p className="font-display-md text-display-md text-on-background">
                NPR {course.priceNpr.toLocaleString()}
              </p>
            </div>
            {payment?.receiptPath && (
              <a
                href={payment.receiptPath}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-medium text-primary"
              >
                View uploaded receipt
              </a>
            )}
          </div>

          {status === "PENDING" && hasReceipt && (
            <p className="mt-4 rounded-xl bg-primary-container/10 px-4 py-3 text-sm text-on-surface-variant">
              Receipt received. Study access unlocks after admin approval.
            </p>
          )}

          <Button href="/dashboard" variant="outline" className="mt-6">
            Go to dashboard
          </Button>
        </Card>

        <ReceiptUploadForm courseSlug={course.slug} />
      </div>
    </div>
  );
}
