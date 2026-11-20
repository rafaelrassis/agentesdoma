import { prisma } from "@/lib/db";
import { AppShell } from "../components/AppShell";
import { TaskBoard } from "../components/TaskBoard";
import { Button, Card, Field, controlClass } from "../components/ui";
import { createTask } from "./actions";

export const dynamic = "force-dynamic";

export default async function Tarefas() {
  const tasks = await prisma.task.findMany({ orderBy: [{ column: "asc" }, { position: "asc" }] });

  return (
    <AppShell title="Tarefas & ideias" subtitle="Doma Baby · backlog de planejamento, humano + agentes">
      <div className="flex flex-col gap-5">
        <Card title="Nova tarefa">
          <form action={createTask} className="flex flex-wrap items-end gap-3">
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
