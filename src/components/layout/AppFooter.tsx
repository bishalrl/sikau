import Link from "next/link";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { FooterNewsletter } from "./FooterNewsletter";

type LinkItem = { label: string; href: string };
type SocialItem = { label: string; href: string; icon: string };

type Props = {
  variant?: "dark" | "light";
  siteName?: string;
  description?: string;
  copyrightName?: string;
  quickHeading?: string;
  quickLinks?: LinkItem[];
  resourceHeading?: string;
  resourceLinks?: LinkItem[];
  legalLinks?: LinkItem[];
  socialLinks?: SocialItem[];
  newsletterHeading?: string;
};

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "NEPSE Ebook", href: "/ebooks" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
];

const resourceLinks = [
  { label: "Subscribe newsletter", href: "/newsletter" },
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

export function AppFooter({
  variant = "dark",
  siteName,
  description,
  copyrightName,
  quickHeading,
  quickLinks: quickLinksProp,
  resourceHeading,
  resourceLinks: resourceLinksProp,
  legalLinks: legalLinksProp,
  socialLinks: socialLinksProp,
  newsletterHeading,
}: Props) {
  const quick = quickLinksProp?.length ? quickLinksProp : quickLinks;
  const resources = resourceLinksProp?.length ? resourceLinksProp : resourceLinks;
  const legal = legalLinksProp?.length ? legalLinksProp : legalLinks;
  const social = socialLinksProp?.length ? socialLinksProp : socialLinks;
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
              {siteName || "Sikau Paisa"}
            </Link>
            <p className="app-footer__description">
              {description ??
                "Empowering every Nepali household with the right knowledge of money, saving, investing and wealth creation. Founded by Raju Khatiwada."}
            </p>
            <nav className="app-footer__social" aria-label="Social media">
              {social.map(({ label, href, icon }) => (
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
              {quickHeading || "Quick Links"}
            </h2>
            <ul className="app-footer__links">
              {quick.map((link) => (
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
              {resourceHeading || "Resources"}
            </h2>
            <ul className="app-footer__links">
              {resources.map((link) => (
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
              {newsletterHeading || "Newsletter"}
            </h2>
            <FooterNewsletter variant={variant} />
          </section>
        </div>

        <div className="app-footer__bottom">
          <p className="app-footer__copyright">
            © {new Date().getFullYear()} {copyrightName || "Sikau Paisa"}. All rights reserved.
          </p>
          <nav className="app-footer__legal" aria-label="Legal">
            {legal.map((link) => (
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
