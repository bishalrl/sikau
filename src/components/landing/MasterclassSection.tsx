import Image from "next/image";
import Link from "next/link";
import { SITE_ASSETS } from "@/lib/site-assets";
import { MaterialIcon } from "./MaterialIcon";

const MASTERCLASS_IMAGE = SITE_ASSETS.raju3;

const features = [
  "4+ Hours of On-Demand HD Video",
  "Lifetime Access & Free Updates",
  "Exclusive Community Networking",
  "Ready-to-use Wealth Calculators",
];

export function MasterclassSection() {
  return (
    <section className="py-xl" id="learn">
      <div className="site-container">
        <div className="reveal active flex flex-col overflow-hidden rounded-3xl bg-secondary lg:flex-row">
          <div className="relative min-h-[400px] lg:w-1/2">
            <Image
              src={MASTERCLASS_IMAGE}
              alt="Financial charts on tablet"
              fill
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button type="button" className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-110">
                <MaterialIcon name="play_arrow" size={40} filled />
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-md p-xl lg:w-1/2">
            <div className="flex items-center gap-xs">
              <span className="rounded bg-tertiary-container/20 px-sm py-1 font-label-sm uppercase tracking-widest text-tertiary-container">
                Premium Course
              </span>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaterialIcon key={i} name="star" filled />
                ))}
              </div>
            </div>
            <h2 className="font-display-md text-display-md text-white">Personal Finance Masterclass</h2>
            <ul className="space-y-sm">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-sm font-body-md text-secondary-fixed-dim">
                  <MaterialIcon name="check_circle" className="text-primary-fixed" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-lg pt-md">
              <div>
                <span className="block text-label-sm text-secondary-fixed-dim line-through">NPR 4,999</span>
                <span className="text-display-md font-bold text-white">NPR 1,999</span>
              </div>
              <Link href="/ebooks" className="emerald-gradient flex-1 rounded-xl py-md text-center font-label-md text-white transition-all hover:brightness-110">
                Get the Ebook
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
