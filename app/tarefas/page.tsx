import { prisma } from "@/lib/db";
import { AppShell } from "../components/AppShell";
import { TaskBoard } from "../components/TaskBoard";
import { createTask } from "./actions";

export const dynamic = "force-dynamic";

export default async function Tarefas() {
  const tasks = await prisma.task.findMany({ orderBy: [{ column: "asc" }, { position: "asc" }] });

  return (
    <AppShell title="Tarefas & ideias" subtitle="Doma Baby · backlog de planejamento, humano + agentes">
      <div className="space-y-6">
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Nova tarefa</h2>
          <form action={createTask} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
              Título
              <input
                name="title"
                placeholder="ex: testar cupom de frete grátis"
                required
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition-colors focus:border-rose-500"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
              Detalhe (opcional)
              <input
                name="detail"
                placeholder="contexto, link, por quê"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none transition-colors focus:border-rose-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Coluna
              <select
                name="column"
                defaultValue="backlog"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
              >
                <option value="backlog">Backlog</option>
                <option value="proximo_ciclo">Próximo ciclo</option>
                <option value="fazendo">Fazendo</option>
                <option value="feito">Feito</option>
              </select>
            </label>
            <button className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-400">
              Adicionar
            </button>
          </form>
        </section>

        <TaskBoard initialTasks={tasks} />

        <p className="text-xs leading-relaxed text-neutral-500">
          Arraste um card entre colunas pra mudar de status. Os agentes (<code>vendas</code>,{" "}
          <code>marketing</code>, <code>gerente</code>) também podem propor tarefas escrevendo em{" "}
          <code>out/tarefas-propostas.md</code> — o worker sincroniza pro Backlog a cada ciclo.
        </p>
      </div>
    </AppShell>
  );
}
