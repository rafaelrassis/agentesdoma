import { prisma } from "@/lib/db";
import { createOrder, logout } from "./actions";

export const dynamic = "force-dynamic";

const AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "na fila",
  claimed: "pego pelo worker",
  running: "rodando",
  done: "concluída",
  failed: "falhou",
  completed: "concluído",
};

export default async function Home() {
  const [orders, runs, latestSnapshot, reports] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.run.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.snapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const lastRunByAgent = Object.fromEntries(
    AGENTS.map((agent) => [agent, runs.find((r) => r.agent === agent)])
  );

  const snapshotData = latestSnapshot?.data as Record<string, any> | undefined;
  const loja = snapshotData?.loja;
  const logistica = snapshotData?.logistica;

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Doma Baby — painel de agentes</h1>
            <p className="text-sm text-neutral-400">Shopee BR · loja claitinha</p>
          </div>
          <form action={logout}>
            <button className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900">
              Sair
            </button>
          </form>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGENTS.map((agent) => {
            const run = lastRunByAgent[agent];
            return (
              <div key={agent} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="text-sm font-medium capitalize">{agent}</p>
                {run ? (
                  <>
                    <p className="mt-1 text-xs text-neutral-400">
                      {STATUS_LABEL[run.status] ?? run.status}
                    </p>
                    <p className="text-xs text-neutral-500">{formatDate(run.startedAt)}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">sem execução ainda</p>
                )}
              </div>
            );
          })}
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Último snapshot</h2>
          {latestSnapshot ? (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Vendas" value={loja?.vendas_totais ?? "null"} />
              <Stat label="Visitantes/dia" value={loja?.visitantes_dia ?? "null"} />
              <Stat label="Conversão" value={loja?.conversao != null ? `${loja.conversao}%` : "null"} />
              <Stat label="Produtos ativos" value={loja?.produtos_ativos ?? "null"} />
              <Stat label="Saldo Ads" value={loja?.saldo_ads != null ? `R$ ${loja.saldo_ads}` : "null"} />
              <Stat label="Envio Turbo" value={logistica?.envio_turbo ? "liberado" : "bloqueado"} />
              <Stat label="Frete Grátis" value={logistica?.frete_gratis ? "sim" : "não"} />
              <Stat label="Data" value={latestSnapshot.date} />
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Nenhum snapshot enviado pelo worker ainda.</p>
          )}
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Nova ordem</h2>
          <form action={createOrder} className="flex flex-col gap-3 sm:flex-row">
            <select
              name="agent"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            >
              {AGENTS.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            <input
              name="prompt"
              placeholder="ex: rodar o ciclo da Doma Baby"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900">
              Enviar
            </button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">
            O worker na sua máquina puxa essa fila e roda <code>claude -p</code> em ~/doma-agents.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Fila / histórico de ordens</h2>
          <div className="space-y-2">
            {orders.length === 0 && <p className="text-sm text-neutral-500">Nenhuma ordem ainda.</p>}
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{order.agent}</span>
                  <span className="text-xs text-neutral-400">
                    {STATUS_LABEL[order.status] ?? order.status} · {formatDate(order.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-neutral-300">{order.prompt}</p>
                {order.result && (
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-neutral-400">{order.result}</pre>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Relatórios recentes</h2>
          <div className="space-y-3">
            {reports.length === 0 && <p className="text-sm text-neutral-500">Nenhum relatório ainda.</p>}
            {reports.map((report) => (
              <details key={report.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <summary className="cursor-pointer text-sm">
                  <span className="font-medium capitalize">{report.agent}</span>{" "}
                  <span className="text-neutral-400">— {report.path}</span>
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-neutral-300">{report.content}</pre>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-medium">{String(value)}</p>
    </div>
  );
}
