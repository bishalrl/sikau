import Link from "next/link";
import { redirect } from "next/navigation";
import { NewsletterReceiptForm } from "@/components/newsletter/NewsletterReceiptForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ensureNewsletterProduct,
  getNewsletterPlanByCode,
  getNewsletterProductForUser,
} from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

type Props = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function NewsletterPayPage({ searchParams }: Props) {
  const session = await getCurrentSession();
  const params = await searchParams;
  const planParam = (params.plan ?? "").toUpperCase();

  if (!session?.user) {
    const callback = planParam
      ? `/newsletter/pay?plan=${encodeURIComponent(planParam)}`
      : "/newsletter/pay";
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  await ensureNewsletterProduct(session.user.role === "ADMIN" ? session.user.id : undefined);
  const product = await getNewsletterProductForUser(session.user.id);

  if (!product) {
    redirect("/newsletter");
  }

  if (product.paymentStatus === "APPROVED") {
    redirect(`/community/${product.community.slug}`);
  }

  const planFromQuery = planParam
    ? await getNewsletterPlanByCode(product.id, planParam)
    : null;
  const plan =
    (planFromQuery?.isActive !== false && planFromQuery ? planFromQuery : null) ??
    product.order?.plan ??
    product.plans[0] ??
    null;

  if (plan) {
    try {
      if (product.order) {
        await prisma.newsletterOrder.update({
          where: { id: product.order.id },
          data: { planId: plan.id, amount: plan.priceNpr },
        });
      } else {
        await prisma.newsletterOrder.create({
          data: {
            userId: session.user.id,
            productId: product.id,
            planId: plan.id.startsWith("fallback-") ? null : plan.id,
            amount: plan.priceNpr,
          },
        });
      }
    } catch (error) {
      // Older DBs may not have planId yet — still show the pay UI with the plan amount.
      console.error("Unable to sync newsletter order plan (run prisma db push):", error);
      try {
        if (product.order) {
          await prisma.newsletterOrder.update({
            where: { id: product.order.id },
            data: { amount: plan.priceNpr },
          });
        } else {
          await prisma.newsletterOrder.create({
            data: {
              userId: session.user.id,
              productId: product.id,
              amount: plan.priceNpr,
            },
          });
        }
      } catch (innerError) {
        console.error("Unable to sync newsletter order amount:", innerError);
      }
    }
  }

  const amount = plan?.priceNpr ?? product.order?.amount ?? product.priceNpr;
  const planLabel = plan?.label ?? "Monthly";

  return (
    <div className="site-container py-xl">
      <Link href="/newsletter#pricing" className="text-sm font-medium text-primary">
        ← Back to NEPSE Weekly
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              NEPSE Weekly Payment
            </p>
            <Badge variant="emerald">
              {product.paymentStatus === "REJECTED"
                ? "Rejected — re-upload"
                : product.order?.receiptPath
                  ? "Awaiting approval"
                  : "Pay, then upload receipt"}
            </Badge>
          </div>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">{product.title}</h1>
          <p className="mt-2 text-on-surface-variant">
            Plan: <strong className="text-on-background">{planLabel}</strong>
          </p>
          <p className="mt-2 text-on-surface-variant">
            {product.paymentInstructions ?? "Scan the QR, pay, then upload your receipt for unlock."}
          </p>
          <div className="mt-6 rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-low p-4 text-center sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.paymentQrPath || SITE_ASSETS.qr}
              alt={`${product.title} payment QR`}
              className="mx-auto aspect-square w-full max-w-[min(18rem,100%)] rounded-2xl bg-white object-contain p-3"
            />
            <p className="mt-4 text-sm text-on-surface-variant">
              Scan this bank QR, pay NPR {amount.toLocaleString()}, then upload your receipt.
            </p>
          </div>
          <p className="mt-4 font-headline-md text-on-background">
            NPR {amount.toLocaleString()}
            <span className="ml-2 text-sm font-normal text-on-surface-variant">· {planLabel}</span>
          </p>
        </Card>

        <NewsletterReceiptForm planCode={plan?.code} />
      </div>
    </div>
  );
}
