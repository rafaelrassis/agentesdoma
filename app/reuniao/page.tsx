import { prisma } from "@/lib/db";
import { convocarReuniao } from "../actions";
import { AppShell } from "../components/AppShell";
import { Button, Card } from "../components/ui";
import { dash, formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

function Fala({
  nome,
  quando,
  destaque = false,
  children,
}: {
  nome: string;
  quando: Date | string | null;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-card border p-[18px] ${
        destaque ? "border-brand/50 bg-raised" : "border-line bg-surface"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold capitalize text-ink-strong">{nome}</span>
        <span className="num text-[11px] text-ink-faint" title={formatDate(quando) ?? undefined}>
          {quando ? relativeTime(quando) : "sem fala ainda"}
        </span>
      </div>
      {children}
    </div>
  );
}

export default async function Reuniao() {
  const [latestSnapshot, vendasReport, marketingReport, planoReport] = await Promise.all([
    prisma.snapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.report.findFirst({ where: { agent: "vendas" }, orderBy: { createdAt: "desc" } }),
    prisma.report.findFirst({ where: { agent: "marketing" }, orderBy: { createdAt: "desc" } }),
    prisma.report.findFirst({ where: { agent: "gerente" }, orderBy: { createdAt: "desc" } }),
  ]);

  const snapshotData = latestSnapshot?.data as Record<string, any> | undefined;
  const loja = snapshotData?.loja;
  const logistica = snapshotData?.logistica;

  return (
    <AppShell title="Reunião dos agentes" subtitle="Doma Baby · cada um fala, o gerente fecha">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Card>
          <form action={convocarReuniao} className="flex flex-wrap items-center gap-3">
            <select
              name="target"
              className="min-h-11 rounded-control border border-line-strong bg-sunken px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand-soft"
              defaultValue="local"
            >
              <option value="local">local (seu PC)</option>
              <option value="cloud">cloud (sem PC)</option>
            </select>
            <Button variant="primary" type="submit">
              Convocar reunião
            </Button>
            <span className="text-xs text-ink-faint">
              Enfileira uma ordem pro <code>gerente</code>: ele chama coletor, depois vendas e
              marketing em paralelo, e escreve o plano. Mesma fila de &ldquo;Nova ordem&rdquo;.
            </span>
          </form>
        </Card>

        <section className="flex flex-col gap-3">
          <Fala nome="coletor" quando={latestSnapshot?.createdAt ?? null}>
            {latestSnapshot ? (
              <div className="grid grid-cols-2 gap-2 text-[13px] text-ink sm:grid-cols-3">
                <p className="m-0">Vendas: <span className="num">{dash(loja?.vendas_totais)}</span></p>
                <p className="m-0">Visitantes/dia: <span className="num">{dash(loja?.visitantes_dia)}</span></p>
                <p className="m-0">Conversão: <span className="num">{dash(loja?.conversao, (v: number) => `${v}%`)}</span></p>
                <p className="m-0">Envio Turbo: {logistica?.envio_turbo ? "liberado" : "bloqueado"}</p>
                <p className="m-0">Frete Grátis: {logistica?.frete_gratis ? "sim" : "não"}</p>
                <p className="num m-0">Data do snapshot: {latestSnapshot.date}</p>
              </div>
            ) : (
              <p className="m-0 text-[13px] text-ink-muted">
                Nenhum snapshot ainda — convoque a reunião pra o coletor falar primeiro.
              </p>
            )}
          </Fala>

          <Fala nome="vendas" quando={vendasReport?.createdAt ?? null}>
            {vendasReport ? (
              <pre className="num max-h-80 overflow-y-auto whitespace-pre-wrap rounded-control border border-line bg-sunken p-2.5 text-[11px] leading-relaxed text-ink-muted">
                {vendasReport.content}
              </pre>
            ) : (
              <p className="m-0 text-[13px] text-ink-muted">Ainda não falou.</p>
            )}
          </Fala>

          <Fala nome="marketing" quando={marketingReport?.createdAt ?? null}>
            {marketingReport ? (
              <pre className="num max-h-80 overflow-y-auto whitespace-pre-wrap rounded-control border border-line bg-sunken p-2.5 text-[11px] leading-relaxed text-ink-muted">
                {marketingReport.content}
              </pre>
            ) : (
              <p className="m-0 text-[13px] text-ink-muted">Ainda não falou.</p>
            )}
          </Fala>

          <Fala nome="gerente — ata da reunião" quando={planoReport?.createdAt ?? null} destaque>
            {planoReport ? (
              <pre className="num max-h-96 overflow-y-auto whitespace-pre-wrap rounded-control border border-line bg-sunken p-2.5 text-[13px] text-ink">
                {planoReport.content}
              </pre>
            ) : (
              <p className="m-0 text-[13px] text-ink-muted">
                Ainda sem plano — o gerente fala por último, depois de ouvir todo mundo.
              </p>
            )}
          </Fala>
        </section>

        <p className="text-xs leading-relaxed text-ink-faint">
          Vendas e marketing não se falam direto (regra de separação de escopo); quem cruza as
          falas e decide é o <code>gerente</code>. Datas diferentes nas falas acima = ainda não
          rodou um ciclo novo desde a última reunião.
        </p>
      </div>
    </AppShell>
  );
}
