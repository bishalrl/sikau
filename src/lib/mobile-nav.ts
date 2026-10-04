export const MOBILE_NAV_LINKS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/learn", icon: "school", label: "Courses" },
  { href: "/newsletter", icon: "newspaper", label: "Newsletter" },
  { href: "/tools", icon: "calculate", label: "Tools" },
  { href: "/ebooks", icon: "menu_book", label: "Ebook" },
] as const;

export function isMobileNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/ebooks")) {
    return pathname === "/ebooks" || pathname.startsWith("/ebooks/");
  }
  if (href.startsWith("/learn")) {
    return (
      pathname === "/learn" ||
      pathname.startsWith("/learn/") ||
      pathname.startsWith("/study/")
    );
  }
  if (href.startsWith("/newsletter")) {
    return pathname === "/newsletter" || pathname.startsWith("/newsletter/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
