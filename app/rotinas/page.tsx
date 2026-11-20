import { prisma } from "@/lib/db";
import { createRoutine, toggleRoutine, deleteRoutine } from "../actions";
import { AppShell } from "../components/AppShell";
import { Button, Card, EmptyState, controlClass } from "../components/ui";
import { formatDate, relativeTime } from "@/lib/ui";

export const dynamic = "force-dynamic";

const AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

export default async function Rotinas() {
  const routines = await prisma.routine.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AppShell title="Rotinas dos agentes" subtitle="Doma Baby · execução recorrente">
      <div className="flex flex-col gap-5">
        <Card>
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ink-strong">
              + Nova rotina
            </summary>
            <form action={createRoutine} className="mt-3 flex flex-wrap items-end gap-3">
              <select name="agent" className={controlClass + " flex-[1_1_140px]"}>
                {AGENTS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
              <select name="target" className={controlClass + " flex-[1_1_140px]"} defaultValue="local">
                <option value="local">local (seu PC)</option>
                <option value="cloud">cloud (sem PC)</option>
              </select>
              <select name="model" className={controlClass + " flex-[1_1_140px]"} defaultValue="">
                <option value="">modelo padrão</option>
                <option value="sonnet">Sonnet</option>
                <option value="opus">Opus</option>
                <option value="haiku">Haiku</option>
              </select>
              <label className="flex flex-[1_1_110px] flex-col gap-1.5 text-xs text-ink-muted">
                Repetir a cada
                <input
                  name="frequencyDays"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className={controlClass}
                  aria-label="Repetir a cada quantos dias"
                />
              </label>
              <input
                name="prompt"
                placeholder="ex: rodar o ciclo da Doma Baby"
                className={controlClass + " flex-[999_1_240px]"}
              />
              <Button variant="primary" type="submit">
                Criar rotina
              </Button>
            </form>
          </details>
        </Card>

        <Card title="Rotinas cadastradas">
          <div className="flex flex-col gap-2">
            {routines.length === 0 && <EmptyState>Nenhuma rotina ainda.</EmptyState>}
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex flex-col gap-2 rounded-control border border-line bg-sunken p-3 text-[13px] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    <span className="capitalize">{routine.agent}</span>{" "}
                    <span className="num text-ink-faint">
                      · {routine.target}
                      {routine.model ? ` · ${routine.model}` : ""} · a cada {routine.frequencyDays}d
                    </span>
                  </p>
                  <p className="mt-1 text-ink">{routine.prompt}</p>
                  <p className="num mt-1 text-[11px] text-ink-faint" title={formatDate(routine.lastRunAt) ?? undefined}>
                    última execução: {routine.lastRunAt ? relativeTime(routine.lastRunAt) : "nunca rodou"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleRoutine}>
                    <input type="hidden" name="id" value={routine.id} />
                    <input type="hidden" name="enabled" value={routine.enabled ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`flex min-h-11 items-center rounded-control border px-3 text-[13px] font-medium transition-colors ${
                        routine.enabled
                          ? "border-ok-line bg-ok-bg text-ok-fg"
                          : "border-line-strong bg-surface text-ink-muted"
                      }`}
                    >
                      {routine.enabled ? "Ativa" : "Pausada"}
                    </button>
                  </form>
                  <form action={deleteRoutine}>
                    <input type="hidden" name="id" value={routine.id} />
                    <Button variant="secondary" type="submit">
                      Excluir
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-xs leading-relaxed text-ink-faint">
          O cron automático está desligado. Rotina cadastrada aqui fica só registrada até alguém
          disparar <code>/api/cron/routines</code> manualmente. Cada agente segue as regras do{" "}
          <code>CLAUDE.md</code> — inclusive o congelamento de 14 dias.
        </p>
      </div>
    </AppShell>
  );
}
