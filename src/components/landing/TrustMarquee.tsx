import { MaterialIcon } from "./MaterialIcon";

const items = [
  { icon: "groups", label: "45,000+ Followers" },
  { icon: "school", label: "Practical Learning" },
  { icon: "history", label: "Lifetime Access" },
  { icon: "verified_user", label: "Verified Strategies" },
  { icon: "chat", label: "24/7 Community Support" },
];

export function TrustMarquee() {
  return (
    <section className="bg-primary py-md">
      <div className="marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="marquee-content" aria-hidden={copy === 1}>
            {items.map((item) => (
              <span key={`${copy}-${item.label}`} className="flex items-center gap-sm font-label-md text-white">
                <MaterialIcon name={item.icon} />
                {item.label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
