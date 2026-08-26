import { MessageCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { buildAbandonedCartWhatsAppLink } from "@/lib/whatsapp";
import { getBaseUrl } from "@/lib/site-url";

function timeSince(date: Date) {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function AbandonedCartsPage() {
  const [snapshots, baseUrl] = await Promise.all([
    prisma.cartSnapshot.findMany({
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
    getBaseUrl(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Abandoned Carts</h2>
        <p className="text-sm text-ink-soft">
          Logged-in customers with items still in their cart and no completed booking since. Cart is cleared from
          this list automatically once they book.
        </p>
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No abandoned carts right now.
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((s) => {
            const items: { productName: string; productSlug: string; labName: string; price: number }[] = JSON.parse(
              s.itemsJson
            );
            const total = items.reduce((sum, i) => sum + i.price, 0);
            const waLink = buildAbandonedCartWhatsAppLink({
              patientName: s.user.name,
              phone: s.user.phone,
              items,
              baseUrl,
            });

            return (
              <div key={s.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.user.name}</p>
                    <p className="text-xs text-ink-faint">+91 {s.user.phone}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    <Clock size={13} /> {timeSince(s.updatedAt)}
                  </span>
                </div>

                <div className="mb-3 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">
                        {item.productName} <span className="text-ink-faint">· {item.labName}</span>
                      </span>
                      <span className="font-mono text-ink">{formatInr(item.price)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-semibold">
                    <span className="text-ink">Total</span>
                    <span className="font-mono text-brand-dark">{formatInr(total)}</span>
                  </div>
                </div>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-fit items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <MessageCircle size={14} /> Send WhatsApp reminder
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
