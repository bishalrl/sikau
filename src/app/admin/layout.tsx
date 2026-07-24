import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  const name = session.user.name ?? session.user.email ?? "Admin";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-shell__main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar__eyebrow">Admin Console</p>
            <p className="admin-topbar__title">Manage Sikau Paisa</p>
          </div>
          <div className="admin-topbar__user">
            <div className="admin-topbar__user-meta">
              <span className="admin-topbar__user-name">{name}</span>
              <span className="admin-topbar__user-role">Administrator</span>
            </div>
            <span className="admin-topbar__avatar">{initials}</span>
          </div>
        </header>
        <main className="admin-shell__content">{children}</main>
      </div>
    </div>
  );
}
