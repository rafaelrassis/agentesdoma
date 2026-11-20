import { prisma } from "@/lib/db";
import { AppShell } from "../components/AppShell";
import { EvolutionChart, type MetricPoint } from "../components/EvolutionChart";
import { formatDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

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
      <div className="space-y-6">
        {snapshots.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 text-sm text-neutral-400">
            Ainda não tem nenhum snapshot salvo. Rode o <code>coletor</code> (painel → Nova ordem) pra
            começar a série histórica — cada rodada vira um ponto aqui.
          </div>
        ) : (
          <>
            <p className="text-xs text-neutral-500">
              {snapshots.length} snapshot{snapshots.length > 1 ? "s" : ""} registrado
              {snapshots.length > 1 ? "s" : ""} · do mais antigo (
              {formatDate(snapshots[0].createdAt)}) ao mais recente (
              {formatDate(snapshots.at(-1)!.createdAt)}).
            </p>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EvolutionChart label="Visitantes/dia" points={metric("loja", "visitantes_dia")} color="#fb7185" />
              <EvolutionChart label="Vendas totais" points={metric("loja", "vendas_totais")} color="#fb7185" />
              <EvolutionChart
                label="Conversão"
                points={metric("loja", "conversao")}
                color="#fb7185"
                unit="%"
              />
              <EvolutionChart
                label="Impressões (30d, soma de todos os produtos)"
                points={impressoesPoints}
                color="#fb7185"
              />
              <EvolutionChart
                label="Produtos ativos"
                points={metric("loja", "produtos_ativos")}
                color="#fb7185"
              />
              <EvolutionChart
                label="Saldo Ads"
                points={metric("loja", "saldo_ads")}
                color="#fb7185"
                format={currency}
              />
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
              <h2 className="mb-3 text-sm font-semibold text-neutral-300">
                Envio Turbo / Frete Grátis por snapshot
              </h2>
              <div className="space-y-2">
                {series
                  .slice()
                  .reverse()
                  .map((s, i) => {
                    const turbo = s.data?.logistica?.envio_turbo;
                    const freteGratis = s.data?.logistica?.frete_gratis;
                    return (
                      <div
                        key={`${s.date}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-sm"
                      >
                        <span className="text-neutral-400">{s.date}</span>
                        <div className="flex gap-2">
                          <StatusDot label="Envio Turbo" ok={turbo === true} unknown={turbo == null} />
                          <StatusDot label="Frete Grátis" ok={freteGratis === true} unknown={freteGratis == null} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatusDot({ label, ok, unknown }: { label: string; ok: boolean; unknown: boolean }) {
  const color = unknown ? "bg-neutral-600" : ok ? "bg-emerald-400" : "bg-red-400";
  const text = unknown ? "text-neutral-500" : ok ? "text-emerald-300" : "text-red-300";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${text}`}>
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
