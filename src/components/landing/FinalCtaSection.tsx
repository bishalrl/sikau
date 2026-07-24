import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-xl">
      <div className="relative z-10 site-container text-center">
        <h2 className="reveal active font-display-lg text-display-lg text-white">
          Your Financial Future Starts Today
        </h2>
        <p className="reveal active mt-md mx-auto max-w-2xl font-body-lg text-primary-fixed-dim delay-100">
          Join Raju and 45,000+ others in the mission to make Nepal financially literate and wealthy.
        </p>
        <div className="reveal active mt-lg flex flex-col justify-center gap-md delay-200 sm:flex-row">
          <Link
            href="/learn"
            className="rounded-xl bg-white px-xl py-md font-bold text-primary shadow-2xl transition-transform hover:scale-105"
          >
            Enroll Now - NPR 1,999
          </Link>
          <button
            type="button"
            className="rounded-xl border border-white px-xl py-md font-bold text-white transition-all hover:bg-white/10"
          >
            Get Free Resources
          </button>
        </div>
      </div>
    </section>
  );
}
