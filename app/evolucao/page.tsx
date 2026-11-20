import { prisma } from "@/lib/db";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/ui";
import { EvolutionChart, type MetricPoint } from "../components/EvolutionChart";
import { formatDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

const CHART_COLOR = "#ff80a8";

function pick(data: Record<string, any> | null | undefined, ...path: string[]): number | null {
  let cur: any = data;
  for (const key of path) {
    cur = cur?.[key];
  }
  return typeof cur === "number" ? cur : null;
}

function impressoesTotais(data: Record<string, any> | null | undefined): number | null {
  const produtos = data?.produtos;
  if (!Array.isArray(produtos) || produtos.length === 0) return null;
  let total = 0;
  for (const p of produtos) {
    if (typeof p?.impressoes_30d !== "number") return null;
    total += p.impressoes_30d;
  }
  return total;
}

function currency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function Evolucao() {
  const snapshots = await prisma.snapshot.findMany({ orderBy: { createdAt: "asc" } });

  const series = snapshots.map((s) => ({
    date: s.date,
    data: s.data as Record<string, any> | null,
  }));

  const metric = (...path: string[]): MetricPoint[] =>
    series.map((s) => ({ date: s.date, value: pick(s.data, ...path) }));

  const impressoesPoints: MetricPoint[] = series.map((s) => ({
    date: s.date,
    value: impressoesTotais(s.data),
  }));

  return (
    <AppShell title="Evolução da loja" subtitle="Doma Baby · histórico dos snapshots do coletor">
      <div className="flex flex-col gap-5">
        {snapshots.length === 0 ? (
          <div className="rounded-card border border-line bg-surface p-6 text-[13px] text-ink-muted">
            Ainda não tem nenhum snapshot salvo. Rode o <code>coletor</code> (painel → Nova ordem) pra
            começar a série histórica — cada rodada vira um ponto aqui.
          </div>
        ) : (
          <>
            <p className="text-xs text-ink-faint">
              {snapshots.length} snapshot{snapshots.length > 1 ? "s" : ""} registrado
              {snapshots.length > 1 ? "s" : ""} · do mais antigo (
              {formatDate(snapshots[0].createdAt)}) ao mais recente (
              {formatDate(snapshots.at(-1)!.createdAt)}).
            </p>

            <section className="flex flex-wrap gap-3">
              <EvolutionChart label="Visitantes/dia" points={metric("loja", "visitantes_dia")} color={CHART_COLOR} />
              <EvolutionChart label="Vendas totais" points={metric("loja", "vendas_totais")} color={CHART_COLOR} />
              <EvolutionChart
                label="Conversão"
                points={metric("loja", "conversao")}
                color={CHART_COLOR}
                unit="%"
              />
              <EvolutionChart
                label="Impressões (30d, soma de todos os produtos)"
                points={impressoesPoints}
                color={CHART_COLOR}
              />
              <EvolutionChart
                label="Produtos ativos"
                points={metric("loja", "produtos_ativos")}
                color={CHART_COLOR}
              />
              <EvolutionChart
                label="Saldo Ads"
                points={metric("loja", "saldo_ads")}
                color={CHART_COLOR}
                format={currency}
              />
            </section>

            <Card title="Envio Turbo / Frete Grátis por snapshot">
              <div className="flex flex-col gap-2">
                {series
                  .slice()
                  .reverse()
                  .map((s, i) => {
                    const turbo = s.data?.logistica?.envio_turbo;
                    const freteGratis = s.data?.logistica?.frete_gratis;
                    return (
                      <div
                        key={`${s.date}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-sunken p-2.5 text-[13px]"
                      >
                        <span className="num text-ink-faint">{s.date}</span>
                        <div className="flex gap-3">
                          <LogisticsDot label="Envio Turbo" ok={turbo === true} unknown={turbo == null} />
                          <LogisticsDot label="Frete Grátis" ok={freteGratis === true} unknown={freteGratis == null} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function LogisticsDot({ label, ok, unknown }: { label: string; ok: boolean; unknown: boolean }) {
  const dot = unknown ? "bg-idle" : ok ? "bg-ok" : "bg-fail";
  const text = unknown ? "text-ink-faint" : ok ? "text-ok-fg" : "text-fail-fg";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${text}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
