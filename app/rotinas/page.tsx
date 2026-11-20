import Link from "next/link";
import { prisma } from "@/lib/db";
import { createRoutine, toggleRoutine, deleteRoutine } from "../actions";

export const dynamic = "force-dynamic";

const AGENTS = ["coletor", "marketing", "vendas", "gerente"] as const;

function formatDate(date: Date | string | null) {
  if (!date) return "nunca rodou";
  return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function Rotinas() {
  const routines = await prisma.routine.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Rotinas dos agentes</h1>
            <p className="text-sm text-neutral-400">Doma Baby · execução recorrente</p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            Voltar ao painel
          </Link>
        </header>

        <details className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-300">
            + Nova rotina
          </summary>
          <form action={createRoutine} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
            <select
              name="target"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              defaultValue="local"
            >
              <option value="local">local (seu PC)</option>
              <option value="cloud">cloud (sem PC)</option>
            </select>
            <input
              name="frequencyDays"
              type="number"
              min={1}
              defaultValue={1}
              className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              aria-label="Repetir a cada quantos dias"
            />
            <span className="self-center text-xs text-neutral-500">dia(s)</span>
            <input
              name="prompt"
              placeholder="ex: rodar o ciclo da Doma Baby"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900">
              Criar rotina
            </button>
          </form>
        </details>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Rotinas cadastradas</h2>
          <div className="space-y-2">
            {routines.length === 0 && (
              <p className="text-sm text-neutral-500">Nenhuma rotina ainda.</p>
            )}
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    <span className="capitalize">{routine.agent}</span>{" "}
                    <span className="text-neutral-500">
                      · {routine.target} · a cada {routine.frequencyDays}d
                    </span>
                  </p>
                  <p className="mt-1 text-neutral-300">{routine.prompt}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    última execução: {formatDate(routine.lastRunAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={toggleRoutine}>
                    <input type="hidden" name="id" value={routine.id} />
                    <input type="hidden" name="enabled" value={routine.enabled ? "false" : "true"} />
                    <button
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        routine.enabled
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {routine.enabled ? "Ativa" : "Pausada"}
                    </button>
                  </form>
                  <form action={deleteRoutine}>
                    <input type="hidden" name="id" value={routine.id} />
                    <button className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-neutral-500">
          Um cron na Vercel confere a cada hora quais rotinas estão vencidas e cria uma ordem pra
          elas (mesma fila de "Nova ordem" no painel). Cada agente segue as regras do{" "}
          <code>CLAUDE.md</code> — inclusive o congelamento de 14 dias.
        </p>
      </div>
    </main>
  );
}
