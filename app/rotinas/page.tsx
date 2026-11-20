import { prisma } from "@/lib/db";
import { createRoutine, toggleRoutine, deleteRoutine } from "../actions";
import { AppShell } from "../components/AppShell";
import { formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

const AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

export default async function Rotinas() {
  const routines = await prisma.routine.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AppShell title="Rotinas dos agentes" subtitle="Doma Baby · execução recorrente">
      <div className="space-y-6">
        <details className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-300 marker:content-none">
            + Nova rotina
          </summary>
          <form action={createRoutine} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <select
              name="agent"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
            >
              {AGENTS.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            <select
              name="target"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
              defaultValue="local"
            >
              <option value="local">local (seu PC)</option>
              <option value="cloud">cloud (sem PC)</option>
            </select>
            <select
              name="model"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
              defaultValue=""
            >
              <option value="">modelo padrão</option>
              <option value="sonnet">Sonnet</option>
              <option value="opus">Opus</option>
              <option value="haiku">Haiku</option>
            </select>
            <input
              name="frequencyDays"
              type="number"
              min={1}
              defaultValue={1}
              className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
              aria-label="Repetir a cada quantos dias"
            />
            <span className="self-center text-xs text-neutral-500">dia(s)</span>
            <input
              name="prompt"
              placeholder="ex: rodar o ciclo da Doma Baby"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
            />
            <button className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-400">
              Criar rotina
            </button>
          </form>
        </details>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Rotinas cadastradas</h2>
          <div className="space-y-2">
            {routines.length === 0 && (
              <p className="text-sm text-neutral-500">Nenhuma rotina ainda.</p>
            )}
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm transition-colors hover:border-neutral-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    <span className="capitalize">{routine.agent}</span>{" "}
                    <span className="text-neutral-500">
                      · {routine.target}
                      {routine.model ? ` · ${routine.model}` : ""} · a cada {routine.frequencyDays}d
                    </span>
                  </p>
                  <p className="mt-1 text-neutral-300">{routine.prompt}</p>
                  <p
                    className="mt-1 text-xs text-neutral-500"
                    title={formatDate(routine.lastRunAt) ?? undefined}
                  >
                    última execução: {routine.lastRunAt ? relativeTime(routine.lastRunAt) : "nunca rodou"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleRoutine}>
                    <input type="hidden" name="id" value={routine.id} />
                    <input type="hidden" name="enabled" value={routine.enabled ? "false" : "true"} />
                    <button
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        routine.enabled
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      {routine.enabled ? "Ativa" : "Pausada"}
                    </button>
                  </form>
                  <form action={deleteRoutine}>
                    <input type="hidden" name="id" value={routine.id} />
                    <button className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-600 hover:bg-neutral-900">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs leading-relaxed text-neutral-500">
          O cron automático está desligado. Rotina cadastrada aqui fica só registrada até alguém
          disparar <code>/api/cron/routines</code> manualmente. Cada agente segue as regras do{" "}
          <code>CLAUDE.md</code> — inclusive o congelamento de 14 dias.
        </p>
      </div>
    </AppShell>
  );
}
