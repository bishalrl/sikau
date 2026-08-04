import { Card } from "@/components/ui/Card";
import { getVerifiedUsers, type VerifiedUserRow } from "@/lib/repositories";

function providerLabel(provider: string) {
  if (provider === "google") return "Google";
  return "Email";
}

export default async function AdminUsersPage() {
  const users = await getVerifiedUsers();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Accounts</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Verified users</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Only email-verified accounts (Google sign-in or OTP-verified email).
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-outline-variant/30 px-5 py-4">
          <p className="text-sm font-semibold text-on-background">
            {users.length} verified user{users.length === 1 ? "" : "s"}
          </p>
        </div>

        {users.length === 0 ? (
          <p className="px-5 py-8 text-sm text-on-surface-variant">No verified users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Sign-in</th>
                  <th className="px-5 py-3 font-semibold">Verified</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: VerifiedUserRow) => (
                  <tr key={user.id} className="border-t border-outline-variant/20">
                    <td className="px-5 py-3 font-medium text-on-background">{user.email}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{user.name ?? "—"}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{user.role}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{providerLabel(user.authProvider)}</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {new Date(user.emailVerifiedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
