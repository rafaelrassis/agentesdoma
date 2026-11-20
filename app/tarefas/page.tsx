import { prisma } from "@/lib/db";
import { AppShell } from "../components/AppShell";
import { TaskBoard } from "../components/TaskBoard";
import { Button, Card, Field, controlClass } from "../components/ui";
import { createTask } from "./actions";

export const dynamic = "force-dynamic";

export default async function Tarefas() {
  const tasks = await prisma.task.findMany({ orderBy: [{ column: "asc" }, { position: "asc" }] });

  return (
    <AppShell
      title="Tarefas & ideias"
      subtitle="Doma Baby · backlog de planejamento, humano + agentes"
      actions={
        <a
          href="#nova-tarefa"
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="h-[15px] w-[15px]">
            <path d="M8 3.5v9M3.5 8h9" />
          </svg>
          Nova tarefa
        </a>
      }
    >
      <div className="flex flex-col gap-5">
        <Card title="Nova tarefa">
          <form id="nova-tarefa" action={createTask} className="flex flex-wrap items-end gap-3">
            <Field label="Título" className="flex-[999_1_220px]">
              <input
                name="title"
                placeholder="ex: testar cupom de frete grátis"
                required
                className={controlClass}
              />
            </Field>
            <Field label="Detalhe (opcional)" className="flex-[999_1_220px]">
              <input name="detail" placeholder="contexto, link, por quê" className={controlClass} />
            </Field>
            <Field label="Coluna" className="flex-[1_1_160px]">
              <select name="column" defaultValue="backlog" className={controlClass}>
                <option value="backlog">Backlog</option>
                <option value="proximo_ciclo">Próximo ciclo</option>
                <option value="fazendo">Fazendo</option>
                <option value="feito">Feito</option>
              </select>
            </Field>
            <Button variant="primary" type="submit">
              Adicionar
            </Button>
          </form>
        </Card>

        <TaskBoard initialTasks={tasks} />

        <p className="text-xs leading-relaxed text-ink-faint">
          Arraste um card entre colunas pra mudar de status. Os agentes (<code>vendas</code>,{" "}
          <code>marketing</code>, <code>gerente</code>) também podem propor tarefas escrevendo em{" "}
          <code>out/tarefas-propostas.md</code> — o worker sincroniza pro Backlog a cada ciclo.
        </p>
      </div>
    </AppShell>
  );
}
