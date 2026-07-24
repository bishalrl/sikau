import { MaterialIcon } from "./MaterialIcon";

const links = [
  { href: "/ebooks", icon: "menu_book", label: "Ebook", active: true },
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
          className={`flex flex-col items-center justify-center ${
            link.active
              ? "relative text-primary after:mt-1 after:h-1 after:w-1 after:rounded-full after:bg-primary after:content-['']"
              : "text-on-surface-variant"
          }`}
        >
          <MaterialIcon name={link.icon} />
          <span className="font-label-sm text-[10px]">{link.label}</span>
        </a>
      ))}
    </nav>
  );
}
