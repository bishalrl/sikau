import { Card } from "@/components/ui/Card";
import { getNewsletterSubscribers } from "@/lib/repositories";

export default async function AdminNewsletterPage() {
  const subscribers = await getNewsletterSubscribers();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Audience</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Newsletter requests</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Emails submitted from the site footer newsletter form.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-outline-variant/30 px-5 py-4">
          <p className="text-sm font-semibold text-on-background">
            {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
          </p>
        </div>

        {subscribers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-on-surface-variant">No newsletter requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-outline-variant/20">
                    <td className="px-5 py-3 font-medium text-on-background">{subscriber.email}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{subscriber.source}</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {new Date(subscriber.createdAt).toLocaleString()}
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
