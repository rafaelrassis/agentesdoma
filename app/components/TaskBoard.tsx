"use client";

import { useState, useTransition } from "react";
import { moveTask, deleteTask } from "../tarefas/actions";

type Task = {
  id: string;
  title: string;
  detail: string | null;
  column: string;
  createdBy: string;
};

const COLUMNS = [
  { key: "backlog", title: "Backlog", accent: "border-t-idle" },
  { key: "proximo_ciclo", title: "Próximo ciclo", accent: "border-t-run" },
  { key: "fazendo", title: "Fazendo", accent: "border-t-warn" },
  { key: "feito", title: "Feito", accent: "border-t-ok" },
] as const;

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(column: string) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));
    startTransition(() => {
      moveTask(id, column);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.column === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className={`flex min-h-[140px] min-w-[220px] flex-[1_1_220px] flex-col gap-3 rounded-card border border-line border-t-2 bg-surface p-3 ${col.accent}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                {col.title}
              </h2>
              <span className="num rounded-full border border-line-strong px-[7px] py-0.5 text-[11px] text-ink-faint">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {colTasks.length === 0 && (
                <p className="text-xs text-ink-faint">vazio — arraste um card aqui</p>
              )}
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  className="group cursor-grab rounded-control border border-line bg-sunken p-2.5 text-xs active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-ink">{task.title}</p>
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <button
                        type="submit"
                        aria-label="Excluir tarefa"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-ink-faint opacity-0 transition-opacity hover:text-fail-fg group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="h-3.5 w-3.5">
                          <path d="M4 4 12 12M12 4 4 12" />
                        </svg>
                      </button>
                    </form>
                  </div>
                  {task.detail && <p className="mt-1 text-ink-muted">{task.detail}</p>}
                  <p className="num mt-1.5 text-[10px] uppercase tracking-wide text-ink-faint">
                    {task.createdBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
