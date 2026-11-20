import { AppShell } from "../components/AppShell";
import { StatusPill } from "../components/StatusPill";
import { Card, EmptyState } from "../components/ui";
import { getAlerts } from "@/lib/alerts";
import { formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function Alertas() {
  const { items, failedOrders, semEstoque, penalidades } = await getAlerts();

  return (
    <AppShell title="Alertas" subtitle="Doma Baby · o que precisa de você agora">
      <div className="flex flex-col gap-5">
        {items.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-card border border-ok-line bg-ok-bg px-[18px] py-4 text-[13px] text-ok-fg">
            <span className="h-2 w-2 shrink-0 rounded-full bg-ok" />
            Nada pedindo atenção agora. Nenhuma ordem falhou, Envio Turbo liberado (ou sem dado
            contrário), worker local respondendo.
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            {items.map((item) => {
              const critical = item.severity === "critical";
              return (
                <div
                  key={item.id}
                  id={item.id === "envio-turbo" ? "turbo" : undefined}
                  className={`flex items-start gap-3 rounded-card border px-[18px] py-4 text-[13px] ${
                    critical ? "border-fail-line bg-fail-bg text-fail-fg" : "border-warn-line bg-warn-bg text-warn-fg"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${critical ? "bg-fail" : "bg-warn"}`} />
                  <div className="min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs opacity-80">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <Card title="Ordens que falharam">
          <div className="flex flex-col gap-2">
            {failedOrders.length === 0 && <EmptyState>Nenhuma ordem falhou até agora.</EmptyState>}
            {failedOrders.map((order) => (
              <div key={order.id} className="rounded-control border border-line bg-sunken p-3 text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium capitalize text-ink">
                    {order.agent}{" "}
                    <span className="num font-normal text-ink-faint">
                      · {order.target}
                      {order.model ? ` · ${order.model}` : ""}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusPill status={order.status} />
                    <span className="num text-[11px] text-ink-faint" title={formatDate(order.createdAt) ?? undefined}>
                      {relativeTime(order.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-ink">{order.prompt}</p>
                {order.result && (
                  <pre className="num mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-control border border-line bg-canvas p-2.5 text-[11px] leading-relaxed text-ink-muted">
                    {order.result}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>

        {semEstoque.length > 0 && (
          <Card title="Produtos sem estoque">
            <ul className="m-0 list-inside list-disc space-y-1 pl-1 text-[13px] text-ink">
              {semEstoque.map((p: any, i: number) => (
                <li key={`${p?.sku ?? p?.nome ?? i}`}>
                  {p?.nome ?? "produto sem nome"}
                  {p?.sku ? ` · ${p.sku}` : ""}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {penalidades.length > 0 && (
          <Card title="Penalidades na conta">
            <ul className="m-0 list-inside list-disc space-y-1 pl-1 text-[13px] text-ink">
              {penalidades.map((p, i) => (
                <li key={i}>{String(p)}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
