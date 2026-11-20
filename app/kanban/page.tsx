import { prisma } from "@/lib/db";
import { AppShell } from "../components/AppShell";
import { formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "queued", title: "Na fila", statuses: ["pending"], accent: "border-t-warn" },
  { key: "running", title: "Rodando", statuses: ["claimed", "running"], accent: "border-t-run" },
  { key: "done", title: "Concluída", statuses: ["done", "completed"], accent: "border-t-ok" },
  { key: "failed", title: "Falhou", statuses: ["failed"], accent: "border-t-fail" },
] as const;

export default async function Kanban() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <AppShell title="Kanban das ordens" subtitle="Doma Baby · visão por status (só leitura)">
      <div className="-mx-7 flex gap-3 overflow-x-auto px-7 pb-2">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => (col.statuses as readonly string[]).includes(o.status));
          return (
            <div
              key={col.key}
              className={`w-[240px] shrink-0 rounded-card border border-line border-t-2 bg-surface p-3 ${col.accent}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                  {col.title}
                </h2>
                <span className="num rounded-full border border-line-strong px-[7px] py-0.5 text-[11px] text-ink-faint">
                  {colOrders.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {colOrders.length === 0 && <p className="text-xs text-ink-faint">vazio</p>}
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-control border border-line bg-sunken p-2.5 text-xs transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize text-ink">{order.agent}</span>
                      <span className="num shrink-0 text-ink-faint" title={formatDate(order.createdAt) ?? undefined}>
                        {relativeTime(order.createdAt)}
                      </span>
                    </div>
                    <p className="num mt-1 text-ink-faint">
                      {order.target}
                      {order.model ? ` · ${order.model}` : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-ink">{order.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
