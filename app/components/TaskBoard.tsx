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
  { key: "backlog", title: "Backlog", accent: "border-t-neutral-500" },
  { key: "proximo_ciclo", title: "Próximo ciclo", accent: "border-t-sky-500" },
  { key: "fazendo", title: "Fazendo", accent: "border-t-amber-500" },
  { key: "feito", title: "Feito", accent: "border-t-emerald-500" },
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.column === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className={`min-h-[140px] rounded-xl border-x border-b border-t-2 border-neutral-800 bg-neutral-900/70 p-3 ${col.accent}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-300">{col.title}</h2>
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.length === 0 && <p className="text-xs text-neutral-600">vazio — arraste um card aqui</p>}
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  className="group cursor-grab rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-neutral-100">{task.title}</p>
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <button
                        type="submit"
                        className="shrink-0 text-neutral-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        title="Excluir"
                      >
                        ×
                      </button>
                    </form>
                  </div>
                  {task.detail && <p className="mt-1 text-neutral-400">{task.detail}</p>}
                  <p className="mt-1.5 text-[10px] uppercase tracking-wide text-neutral-600">
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
