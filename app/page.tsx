import { prisma } from "@/lib/db";
import { createOrder, toggleColetorCloud, checkShopeeLogin } from "./actions";
import { AutoRefresh } from "./auto-refresh";
import { AppShell } from "./components/AppShell";
import { StatusPill, StatusDot } from "./components/StatusPill";
import {
  Blocker,
  Button,
  Card,
  EmptyState,
  Explainer,
  Field,
  Stat,
  StatRow,
  controlClass,
} from "./components/ui";
import { dash, formatDate, relativeTime, type StatusKind } from "@/lib/ui";

export const dynamic = "force-dynamic";

const AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

export default async function Home() {
  const [orders, runs, latestSnapshot, reports, cloudSettings, shopeeLoginLocal] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.run.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.snapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.cloudSettings.findUnique({ where: { id: 1 } }),
    prisma.shopeeLogin.findUnique({ where: { target: "local" } }),
  ]);

  const lastRunByAgent = Object.fromEntries(
    AGENTS.map((agent) => [agent, runs.find((r) => r.agent === agent)])
  );

  const snapshotData = latestSnapshot?.data as Record<string, unknown> | undefined;
  const loja = snapshotData?.loja as Record<string, number | null> | undefined;
  const logistica = snapshotData?.logistica as Record<string, boolean> | undefined;
  const turboBloqueado = logistica ? !logistica.envio_turbo : null;

  const loginFarol =
    shopeeLoginLocal?.loggedIn === true
      ? { dot: "bg-ok", text: "text-ok-fg", label: "Logado" }
      : shopeeLoginLocal?.loggedIn === false
        ? { dot: "bg-fail", text: "text-fail-fg", label: "Deslogado" }
        : { dot: "bg-idle", text: "text-idle-fg", label: shopeeLoginLocal ? "Erro ao checar" : "Nunca checado" };

  const subtitle = latestSnapshot ? (
    <>
      Último snapshot <span className="num text-ink">{latestSnapshot.date}</span>
    </>
  ) : (
    "coletor não rodou hoje"
  );

  return (
    <AppShell
      title="Visão geral"
      subtitle={subtitle}
      actions={
        <a
          href="#nova-ordem"
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="h-[15px] w-[15px]">
            <path d="M8 3.5v9M3.5 8h9" />
          </svg>
          Nova ordem
        </a>
      }
    >
      <AutoRefresh />
      <div className="flex flex-col gap-5">
        {/* 1. bloqueio — o único alerta em área grande */}
        {turboBloqueado && (
          <Blocker
            title="Envio Turbo bloqueado — prioridade máxima"
            actionHref="/alertas#turbo"
            actionLabel="Roteiro do chamado"
          >
            Sem Turbo a loja fica fora do Frete Grátis, o maior filtro de busca da Shopee.
          </Blocker>
        )}

        {/* 2. KPIs — número grande, nota que explica o número */}
        <StatRow>
          <Stat label="Vendas totais" value={dash(loja?.vendas_totais)} note="desde a abertura" />
          <Stat
            label="Visitantes/dia"
            value={dash(loja?.visitantes_dia)}
            note="o gargalo é tráfego"
            tone="warn"
          />
          <Stat label="Conversão" value={dash(loja?.conversao, (v: number) => `${v}%`)} />
          <Stat label="Produtos ativos" value={dash(loja?.produtos_ativos)} />
          <Stat
            label="Saldo Ads"
            value={dash(loja?.saldo_ads, (v: number) => `R$ ${v}`)}
            note="campanhas paradas"
            tone={loja?.saldo_ads === 0 ? "fail" : "default"}
          />
        </StatRow>

        {/* 3. agentes */}
        <section className="flex flex-col gap-2.5">
          <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
            Agentes
          </h2>
          <div className="flex flex-wrap gap-3">
            {AGENTS.map((agent) => {
              const run = lastRunByAgent[agent];
              const status = (run?.status ?? "idle") as StatusKind;
              return (
                <div
                  key={agent}
                  className="flex min-w-0 flex-[1_1_200px] flex-col gap-3 rounded-card border border-line bg-surface p-[18px]"
                >
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={status} />
                    <span className="min-w-0 flex-1 text-sm font-semibold capitalize text-ink-strong">
                      {agent}
                    </span>
                    <span className="num text-[11px] text-ink-faint" title={formatDate(run?.startedAt) ?? undefined}>
                      {relativeTime(run?.startedAt) ?? "—"}
                    </span>
                  </div>
                  <StatusPill status={status} />
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. duas colunas: fila à esquerda, apoio à direita */}
        <div className="flex flex-wrap items-start gap-5">
          <div className="min-w-0 flex-[999_1_420px]">
            <Card title="Fila de ordens" padded={false}>
              <ul className="m-0 list-none p-0">
                {orders.length === 0 && (
                  <li className="px-[18px] py-4">
                    <EmptyState>Nenhuma ordem ainda.</EmptyState>
                  </li>
                )}
                {orders.map((order) => (
                  <li key={order.id} className="flex gap-3 border-t border-line px-[18px] py-3.5">
                    <StatusDot status={order.status} className="mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[13px] font-semibold capitalize text-ink-strong">
                          {order.agent}
                        </span>
                        <span className="num text-[11px] text-ink-faint">
                          · {order.target}
                          {order.model ? ` · ${order.model}` : ""}
                        </span>
                        <span className="flex-1" />
                        <span className="num text-[11px] text-ink-faint" title={formatDate(order.createdAt) ?? undefined}>
                          {relativeTime(order.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-[13px] text-ink">{order.prompt}</p>
                      {order.result && (
                        <pre className="num mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-control border border-line bg-sunken p-2.5 text-[11px] leading-relaxed text-ink-muted">
                          {order.result}
                        </pre>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
            <Card title="Relatórios">
              <div className="flex flex-col gap-1.5">
                {reports.length === 0 && <EmptyState>Nenhum relatório ainda.</EmptyState>}
                {reports.map((report) => (
                  <details
                    key={report.id}
                    className="group rounded-control border border-line bg-sunken px-2.5 py-1.5"
                  >
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2.5">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-[15px] w-[15px] shrink-0 text-ink-faint"
                      >
                        <path d="M9 2H4.5v12h7V4.5zM9 2v2.5h2.5" />
                      </svg>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium capitalize text-ink">
                          {report.agent}
                        </span>
                        <span className="num block break-all text-[11px] text-ink-faint">
                          {report.path}
                        </span>
                      </span>
                    </summary>
                    <pre className="num mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-control border border-line bg-canvas p-2.5 text-[11px] leading-relaxed text-ink-muted">
                      {report.content}
                    </pre>
                  </details>
                ))}
              </div>
            </Card>

            <Card title="Login Shopee (local)">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                  <span className={`h-[9px] w-[9px] shrink-0 rounded-full ${loginFarol.dot}`} />
                  <span className={loginFarol.text}>{loginFarol.label}</span>
                </span>
                <span className="num text-[11px] text-ink-faint" title={formatDate(shopeeLoginLocal?.checkedAt) ?? undefined}>
                  {shopeeLoginLocal ? relativeTime(shopeeLoginLocal.checkedAt) : ""}
                </span>
                <span className="flex-1" />
                <form action={checkShopeeLogin}>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-strong px-3 text-[13px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    Checar agora
                  </button>
                </form>
              </div>
              {shopeeLoginLocal?.detail && (
                <p className="mt-2 text-[12px] text-ink-faint">{shopeeLoginLocal.detail}</p>
              )}
              <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
                Abre uma ordem só-leitura (<code>login-check</code>) que confere o Chrome do seu PC —
                não clica nem digita nada. Precisa do worker local online.
              </p>
            </Card>

            <Card title="Coletor em nuvem" badge="experimental">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <form action={toggleColetorCloud}>
                    <input
                      type="hidden"
                      name="enabled"
                      value={cloudSettings?.coletorCloudEnabled ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      role="switch"
                      aria-checked={!!cloudSettings?.coletorCloudEnabled}
                      aria-label="Coletor em nuvem"
                      className={`flex min-h-11 items-center gap-2 rounded-control border px-3 text-[13px] font-semibold transition-colors ${
                        cloudSettings?.coletorCloudEnabled
                          ? "border-ok-line bg-ok-bg text-ok-fg"
                          : "border-line-strong bg-surface text-ink-muted"
                      }`}
                    >
                      {cloudSettings?.coletorCloudEnabled ? "Ligado" : "Desligado"}
                    </button>
                  </form>
                  <span className="text-[13px] text-ink-muted">
                    Sessão Shopee salva:{" "}
                    {cloudSettings?.shopeeSessionSavedAt ? (
                      <span
                        className="num text-ink"
                        title={formatDate(cloudSettings.shopeeSessionSavedAt) ?? undefined}
                      >
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
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-strong px-3 text-[13px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    Logar pelo site
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10" />
                      <path d="M9.5 2H14v4.5M14 2 7.5 8.5" />
                    </svg>
                  </a>
                </div>
                <Explainer summary="Risco e como renovar a sessão">
                  Reusa cookies de login da Shopee numa sandbox cloud (sem seu PC). Risco: quem tiver
                  acesso ao painel/token age como você na Shopee, e a Shopee pode invalidar a sessão
                  por mudança de IP. Não temos como confirmar daqui se a sessão salva ainda está
                  válida — só o próprio run do coletor em nuvem mostra isso (sucesso ou tela de
                  login). Se cair em tela de login, logue no botão acima e rode de novo{" "}
                  <code>node worker/export-shopee-session.mjs</code> na sua máquina pra atualizar a
                  sessão.
                </Explainer>
              </div>
            </Card>
          </div>
        </div>

        {/* 5. nova ordem no fim, fora da dobra, com a explicação colapsada */}
        <Card title="Nova ordem">
          <form id="nova-ordem" action={createOrder} className="flex flex-wrap items-end gap-3">
            <Field label="Agente" className="flex-[1_1_140px]">
              <select name="agent" className={controlClass}>
                {AGENTS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Onde roda" className="flex-[1_1_140px]">
              <select name="target" className={controlClass} defaultValue="local">
                <option value="local">local (seu PC)</option>
                <option value="cloud">cloud (sem PC)</option>
              </select>
            </Field>
            <Field label="Modelo" className="flex-[1_1_140px]">
              <select name="model" className={controlClass} defaultValue="">
                <option value="">padrão</option>
                <option value="sonnet">Sonnet</option>
                <option value="opus">Opus</option>
                <option value="haiku">Haiku</option>
              </select>
            </Field>
            <Field label="Prompt" className="flex-[999_1_240px]">
              <input name="prompt" placeholder="ex: rodar o ciclo da Doma Baby" className={controlClass} />
            </Field>
            <Button variant="primary" type="submit">
              Enviar
            </Button>
          </form>
          <Explainer summary="Como local, cloud e modelo se comportam">
            <strong className="text-ink">local</strong> — o worker na sua máquina puxa a fila e roda{" "}
            <code>claude -p</code> em ~/doma-agents (sempre funciona pro <code>coletor</code>).{" "}
            <strong className="text-ink">cloud</strong> — roda numa sessão Claude Code Remote, sem
            precisar do PC — o <code>coletor</code> só funciona em cloud se &ldquo;Coletor em
            nuvem&rdquo; estiver ligado acima e houver sessão Shopee salva; senão falha limpo.{" "}
            <strong className="text-ink">modelo</strong> — só vale pra ordens locais, o worker passa
            pro <code>claude -p --model</code>; em cloud ainda não tem quem leia esse campo.
          </Explainer>
        </Card>
      </div>
    </AppShell>
  );
}
