import Link from "next/link";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { FooterNewsletter } from "./FooterNewsletter";

type Props = {
  variant?: "dark" | "light";
  description?: string;
};

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "NEPSE Ebook", href: "/ebooks" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/ebooks#pricing" },
];

const resourceLinks = [
  { label: "Start reading", href: "/ebooks" },
  { label: "Blog", href: "/blog" },
  { label: "Login", href: "/login" },
  { label: "Sign up", href: "/signup" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Cookies", href: "#" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: "groups" },
  { label: "Instagram", href: "#", icon: "photo_camera" },
  { label: "YouTube", href: "#", icon: "play_circle" },
  { label: "LinkedIn", href: "#", icon: "work" },
];

export function AppFooter({ variant = "dark", description }: Props) {
  const isDark = variant === "dark";

  return (
    <footer
      className={isDark ? "app-footer app-footer--dark" : "app-footer app-footer--light"}
      aria-label="Site footer"
    >
      <div className="app-footer__container">
        <div className="app-footer__grid">
          {/* Brand */}
          <section className="app-footer__brand" aria-labelledby="footer-brand-title">
            <Link href="/" className="app-footer__logo" id="footer-brand-title">
              Sikau Paisa
            </Link>
            <p className="app-footer__description">
              {description ??
                "Empowering every Nepali household with the right knowledge of money, saving, investing and wealth creation. Founded by Raju Khatiwada."}
            </p>
            <nav className="app-footer__social" aria-label="Social media">
              {socialLinks.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  className="app-footer__social-link"
                  aria-label={label}
                >
                  <MaterialIcon name={icon} className="text-[18px]" />
                </a>
              ))}
            </nav>
          </section>

          {/* Quick Links */}
          <nav className="app-footer__column" aria-labelledby="footer-quick-links">
            <h2 className="app-footer__heading" id="footer-quick-links">
              Quick Links
            </h2>
            <ul className="app-footer__links">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="app-footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav className="app-footer__column" aria-labelledby="footer-resources">
            <h2 className="app-footer__heading" id="footer-resources">
              Resources
            </h2>
            <ul className="app-footer__links">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="app-footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}
          <section className="app-footer__column" aria-labelledby="footer-newsletter">
            <h2 className="app-footer__heading" id="footer-newsletter">
              Newsletter
            </h2>
            <p className="app-footer__newsletter-text">
              Stay updated with personal finance tips.
            </p>
            <FooterNewsletter variant={variant} />
          </section>
        </div>

        <div className="app-footer__bottom">
          <p className="app-footer__copyright">
            © {new Date().getFullYear()} Sikau Paisa. All rights reserved.
          </p>
          <nav className="app-footer__legal" aria-label="Legal">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="app-footer__legal-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
