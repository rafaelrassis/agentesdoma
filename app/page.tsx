import { prisma } from "@/lib/db";
import { createOrder, toggleColetorCloud } from "./actions";
import { AutoRefresh } from "./auto-refresh";
import { AppShell } from "./components/AppShell";
import { StatusPill } from "./components/StatusPill";
import { formatDate, relativeTime, type StatusKind } from "@/lib/ui";

export const dynamic = "force-dynamic";

const AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

export default async function Home() {
  const [orders, runs, latestSnapshot, reports, cloudSettings] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.run.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.snapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.cloudSettings.findUnique({ where: { id: 1 } }),
  ]);

  const lastRunByAgent = Object.fromEntries(
    AGENTS.map((agent) => [agent, runs.find((r) => r.agent === agent)])
  );

  const snapshotData = latestSnapshot?.data as Record<string, any> | undefined;
  const loja = snapshotData?.loja;
  const logistica = snapshotData?.logistica;
  const turboBloqueado = logistica ? !logistica.envio_turbo : null;

  return (
    <AppShell title="Visão geral" subtitle="Painel de agentes · Shopee BR · loja claitinha">
      <AutoRefresh />
      <div className="space-y-6">
        {turboBloqueado && (
          <div className="flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
            Envio Turbo bloqueado — sem ele a loja sai do Frete Grátis e some da busca. É prioridade
            máxima antes de qualquer outra ação.
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGENTS.map((agent) => {
            const run = lastRunByAgent[agent];
            const status = (run?.status ?? "idle") as StatusKind;
            return (
              <div
                key={agent}
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 transition-colors hover:border-neutral-700"
              >
                <p className="text-sm font-medium capitalize text-neutral-100">{agent}</p>
                <div className="mt-2">
                  <StatusPill status={status} />
                </div>
                {run && (
                  <p className="mt-2 text-xs text-neutral-500" title={formatDate(run.startedAt) ?? undefined}>
                    {relativeTime(run.startedAt)}
                  </p>
                )}
              </div>
            );
          })}
        </section>

        <Card title="Último snapshot">
          {latestSnapshot ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm sm:grid-cols-4">
              <Stat label="Vendas" value={loja?.vendas_totais ?? "null"} />
              <Stat label="Visitantes/dia" value={loja?.visitantes_dia ?? "null"} />
              <Stat label="Conversão" value={loja?.conversao != null ? `${loja.conversao}%` : "null"} />
              <Stat label="Produtos ativos" value={loja?.produtos_ativos ?? "null"} />
              <Stat label="Saldo Ads" value={loja?.saldo_ads != null ? `R$ ${loja.saldo_ads}` : "null"} />
              <Stat
                label="Envio Turbo"
                value={logistica?.envio_turbo ? "liberado" : "bloqueado"}
                tone={logistica ? (logistica.envio_turbo ? "good" : "bad") : "neutral"}
              />
              <Stat
                label="Frete Grátis"
                value={logistica?.frete_gratis ? "sim" : "não"}
                tone={logistica ? (logistica.frete_gratis ? "good" : "bad") : "neutral"}
              />
              <Stat label="Data" value={latestSnapshot.date} />
            </div>
          ) : (
            <EmptyState>Nenhum snapshot enviado pelo worker ainda.</EmptyState>
          )}
        </Card>

        <Card title="Coletor em nuvem" badge="experimental">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <form action={toggleColetorCloud}>
              <input type="hidden" name="enabled" value={cloudSettings?.coletorCloudEnabled ? "false" : "true"} />
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  cloudSettings?.coletorCloudEnabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {cloudSettings?.coletorCloudEnabled ? "Ligado" : "Desligado"}
              </button>
            </form>
            <span className="text-neutral-400">
              Sessão Shopee salva:{" "}
              {cloudSettings?.shopeeSessionSavedAt ? (
                <span className="text-neutral-200" title={formatDate(cloudSettings.shopeeSessionSavedAt) ?? undefined}>
                  {relativeTime(cloudSettings.shopeeSessionSavedAt)}
                </span>
              ) : (
                "nenhuma ainda"
              )}
            </span>
            <a
              href="https://seller.shopee.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-900"
            >
              Logar pelo site
              <ExternalLinkIcon />
            </a>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            Reusa cookies de login da Shopee numa sandbox cloud (sem seu PC). Risco: quem tiver acesso
            ao painel/token age como você na Shopee, e a Shopee pode invalidar a sessão por mudança de
            IP. Não temos como confirmar daqui se a sessão salva ainda está válida — só o próprio run do
            coletor em nuvem mostra isso (sucesso ou tela de login). Se cair em tela de login, logue no
            botão acima e rode de novo <code>node worker/export-shopee-session.mjs</code> na sua máquina
            pra atualizar a sessão.
          </p>
        </Card>

        <Card title="Nova ordem">
          <form action={createOrder} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Agente">
              <select name="agent" className={selectClass}>
                {AGENTS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Onde roda">
              <select name="target" className={selectClass} defaultValue="local">
                <option value="local">local (seu PC)</option>
                <option value="cloud">cloud (sem PC)</option>
              </select>
            </Field>
            <Field label="Modelo">
              <select name="model" className={selectClass} defaultValue="">
                <option value="">padrão</option>
                <option value="sonnet">Sonnet</option>
                <option value="opus">Opus</option>
                <option value="haiku">Haiku</option>
              </select>
            </Field>
            <Field label="Prompt" className="flex-1">
              <input
                name="prompt"
                placeholder="ex: rodar o ciclo da Doma Baby"
                className={inputClass}
              />
            </Field>
            <button className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-400">
              Enviar
            </button>
          </form>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            <strong className="text-neutral-400">local</strong>: o worker na sua máquina puxa a fila e
            roda <code>claude -p</code> em ~/doma-agents (sempre funciona pro <code>coletor</code>).{" "}
            <strong className="text-neutral-400">cloud</strong>: roda numa sessão Claude Code Remote,
            sem precisar do PC — o <code>coletor</code> só funciona em cloud se "Coletor em nuvem"
            estiver ligado acima e houver sessão Shopee salva; senão falha limpo.{" "}
            <strong className="text-neutral-400">Modelo</strong>: só vale pra ordens locais — o
            worker passa pro <code>claude -p --model</code>. Em cloud ainda não tem quem leia esse
            campo, então fica sem efeito.
          </p>
        </Card>

        <Card title="Fila / histórico de ordens">
          <div className="space-y-2">
            {orders.length === 0 && <EmptyState>Nenhuma ordem ainda.</EmptyState>}
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm transition-colors hover:border-neutral-700"
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
        </Card>

        <Card title="Relatórios recentes">
          <div className="space-y-2">
            {reports.length === 0 && <EmptyState>Nenhum relatório ainda.</EmptyState>}
            {reports.map((report) => (
              <details
                key={report.id}
                className="group rounded-lg border border-neutral-800 bg-neutral-950 p-3 transition-colors hover:border-neutral-700"
              >
                <summary className="cursor-pointer text-sm marker:content-none">
                  <span className="font-medium capitalize">{report.agent}</span>{" "}
                  <span className="text-neutral-400">— {report.path}</span>
                </summary>
                <pre className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-neutral-900/60 p-2 text-xs text-neutral-300">
                  {report.content}
                </pre>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

const selectClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition-colors focus:border-rose-500";
const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition-colors focus:border-rose-500";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-neutral-500 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-neutral-300">{title}</h2>
        {badge && (
          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-500">{children}</p>;
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : "text-neutral-100";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-base font-semibold ${toneClass}`}>{String(value)}</p>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-3.5 w-3.5"
    >
      <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10" strokeLinecap="round" />
      <path d="M9.5 2H14v4.5M14 2 7.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
