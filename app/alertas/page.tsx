import { PageHeader, NavLink } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { getAlerts } from "@/lib/alerts";
import { formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function Alertas() {
  const { items, failedOrders, semEstoque, penalidades } = await getAlerts();

  return (
    <main className="min-h-screen px-4 py-8 text-neutral-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader title="Alertas" subtitle="Doma Baby · o que precisa de você agora">
          <NavLink href="/">Voltar ao painel</NavLink>
        </PageHeader>

        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            Nada pedindo atenção agora. Nenhuma ordem falhou, Envio Turbo liberado (ou sem dado
            contrário), worker local respondendo.
          </div>
        ) : (
          <section className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  item.severity === "critical"
                    ? "border-red-900 bg-red-950/30 text-red-200"
                    : "border-amber-900 bg-amber-950/30 text-amber-200"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    item.severity === "critical" ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs opacity-80">{item.detail}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Ordens que falharam</h2>
          <div className="space-y-2">
            {failedOrders.length === 0 && (
              <p className="text-sm text-neutral-500">Nenhuma ordem falhou até agora.</p>
            )}
            {failedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium capitalize">
                    {order.agent}{" "}
                    <span className="font-normal text-neutral-500">
                      · {order.target}
                      {order.model ? ` · ${order.model}` : ""}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusPill status={order.status} />
                    <span className="text-xs text-neutral-500" title={formatDate(order.createdAt) ?? undefined}>
                      {relativeTime(order.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-neutral-300">{order.prompt}</p>
                {order.result && (
                  <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md bg-neutral-900/60 p-2 text-xs text-neutral-400">
                    {order.result}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>

        {semEstoque.length > 0 && (
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-300">Produtos sem estoque</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-neutral-300">
              {semEstoque.map((p: any, i: number) => (
                <li key={`${p?.sku ?? p?.nome ?? i}`}>
                  {p?.nome ?? "produto sem nome"}
                  {p?.sku ? ` · ${p.sku}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {penalidades.length > 0 && (
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-300">Penalidades na conta</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-neutral-300">
              {penalidades.map((p, i) => (
                <li key={i}>{String(p)}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
