import { prisma } from "@/lib/db";
import { PageHeader, NavLink } from "../components/PageHeader";
import { formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "queued", title: "Na fila", statuses: ["pending"], accent: "border-t-amber-500" },
  { key: "running", title: "Rodando", statuses: ["claimed", "running"], accent: "border-t-sky-500" },
  { key: "done", title: "Concluída", statuses: ["done", "completed"], accent: "border-t-emerald-500" },
  { key: "failed", title: "Falhou", statuses: ["failed"], accent: "border-t-red-500" },
] as const;

export default async function Kanban() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <main className="min-h-screen px-4 py-8 text-neutral-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Kanban das ordens" subtitle="Doma Baby · visão por status (só leitura)">
          <NavLink href="/">Voltar ao painel</NavLink>
        </PageHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => (col.statuses as readonly string[]).includes(o.status));
            return (
              <div
                key={col.key}
                className={`rounded-xl border-x border-b border-t-2 border-neutral-800 bg-neutral-900/70 p-3 ${col.accent}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-300">{col.title}</h2>
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colOrders.length === 0 && <p className="text-xs text-neutral-600">vazio</p>}
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs transition-colors hover:border-neutral-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize text-neutral-100">{order.agent}</span>
                        <span className="shrink-0 text-neutral-500" title={formatDate(order.createdAt) ?? undefined}>
                          {relativeTime(order.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-neutral-500">
                        {order.target}
                        {order.model ? ` · ${order.model}` : ""}
                      </p>
                      <p className="mt-1 line-clamp-2 text-neutral-300">{order.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
