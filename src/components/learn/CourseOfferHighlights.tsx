import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { Button } from "@/components/ui/Button";

type Props = {
  description?: string | null;
  includes: string[];
  priceNpr: number;
  href: string;
  cta?: string;
  compact?: boolean;
};

function moneyLabel(priceNpr: number) {
  return priceNpr <= 0 ? "Free" : `NPR ${priceNpr.toLocaleString()}`;
}

export function CourseOfferHighlights({
  description,
  includes,
  priceNpr,
  href,
  cta = "View course",
  compact = false,
}: Props) {
  return (
    <div className={compact ? "mt-md space-y-3" : "space-y-4"}>
      {description ? (
        <p className={`text-on-surface-variant ${compact ? "line-clamp-3 text-sm" : "text-base leading-7"}`}>
          {description}
        </p>
      ) : null}

      {includes.length > 0 ? (
        <ul className="space-y-2">
          {(compact ? includes.slice(0, 4) : includes).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-on-surface">
              <MaterialIcon name="check_circle" className="mt-0.5 shrink-0 text-primary" filled />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`flex items-center gap-3 ${compact ? "pt-1" : "pt-2"}`}>
        <p className={`font-bold text-on-background ${compact ? "text-lg" : "text-2xl"}`}>
          {moneyLabel(priceNpr)}
        </p>
        <Button size={compact ? "sm" : "md"} className="flex-1" href={href} arrow>
          {cta}
        </Button>
      </div>
    </div>
  );
}
