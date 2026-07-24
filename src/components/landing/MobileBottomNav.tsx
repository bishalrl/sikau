import { MaterialIcon } from "./MaterialIcon";

const links = [
  { href: "/", icon: "home", label: "Home", active: true },
  { href: "/ebooks", icon: "menu_book", label: "Ebook" },
  { href: "/blog", icon: "article", label: "Blog" },
  { href: "/login", icon: "person", label: "Login" },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-white/20 bg-surface/80 px-margin-mobile py-sm shadow-[0px_-4px_20px_rgba(15,23,42,0.05)] backdrop-blur-2xl md:hidden">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className={`flex flex-col items-center gap-1 ${
            link.active ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          <MaterialIcon name={link.icon} filled={Boolean(link.active)} />
          <span className="font-label-sm text-[10px]">{link.label}</span>
        </a>
      ))}
    </nav>
  );
}
