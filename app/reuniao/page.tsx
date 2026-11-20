import { prisma } from "@/lib/db";
import { convocarReuniao } from "../actions";
import { AppShell } from "../components/AppShell";
import { formatDate, relativeTime } from "@/lib/ui";

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
      className={`rounded-xl border p-4 ${
        destaque ? "border-rose-800/60 bg-rose-950/20" : "border-neutral-800 bg-neutral-900/70"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold capitalize">{nome}</span>
        <span className="text-xs text-neutral-500" title={formatDate(quando) ?? undefined}>
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
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
          <form action={convocarReuniao} className="flex flex-wrap items-center gap-3">
            <select
              name="target"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
              defaultValue="local"
            >
              <option value="local">local (seu PC)</option>
              <option value="cloud">cloud (sem PC)</option>
            </select>
            <button className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-400">
              Convocar reunião
            </button>
            <span className="text-xs text-neutral-500">
              Enfileira uma ordem pro <code>gerente</code>: ele chama coletor, depois vendas e
              marketing em paralelo, e escreve o plano. Mesma fila de "Nova ordem".
            </span>
          </form>
        </section>

        <section className="space-y-4">
          <Fala nome="coletor" quando={latestSnapshot?.createdAt ?? null}>
            {latestSnapshot ? (
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <p>Vendas: {loja?.vendas_totais ?? "null"}</p>
                <p>Visitantes/dia: {loja?.visitantes_dia ?? "null"}</p>
                <p>Conversão: {loja?.conversao != null ? `${loja.conversao}%` : "null"}</p>
                <p>Envio Turbo: {logistica?.envio_turbo ? "liberado" : "bloqueado"}</p>
                <p>Frete Grátis: {logistica?.frete_gratis ? "sim" : "não"}</p>
                <p>Data do snapshot: {latestSnapshot.date}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Nenhum snapshot ainda — convoque a reunião pra o coletor falar primeiro.
              </p>
            )}
          </Fala>

          <Fala nome="vendas" quando={vendasReport?.createdAt ?? null}>
            {vendasReport ? (
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-neutral-950/60 p-2 text-xs text-neutral-300">
                {vendasReport.content}
              </pre>
            ) : (
              <p className="text-sm text-neutral-500">Ainda não falou.</p>
            )}
          </Fala>

          <Fala nome="marketing" quando={marketingReport?.createdAt ?? null}>
            {marketingReport ? (
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-neutral-950/60 p-2 text-xs text-neutral-300">
                {marketingReport.content}
              </pre>
            ) : (
              <p className="text-sm text-neutral-500">Ainda não falou.</p>
            )}
          </Fala>

          <Fala nome="gerente — ata da reunião" quando={planoReport?.createdAt ?? null} destaque>
            {planoReport ? (
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-neutral-950/60 p-2 text-sm text-neutral-200">
                {planoReport.content}
              </pre>
            ) : (
              <p className="text-sm text-neutral-500">
                Ainda sem plano — o gerente fala por último, depois de ouvir todo mundo.
              </p>
            )}
          </Fala>
        </section>

        <p className="text-xs leading-relaxed text-neutral-500">
          Vendas e marketing não se falam direto (regra de separação de escopo); quem cruza as
          falas e decide é o <code>gerente</code>. Datas diferentes nas falas acima = ainda não
          rodou um ciclo novo desde a última reunião.
        </p>
      </div>
    </AppShell>
  );
}
