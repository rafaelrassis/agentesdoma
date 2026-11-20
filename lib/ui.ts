export function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function relativeTime(date: Date | string | null | undefined) {
  if (!date) return null;
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 45) return "agora";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "ontem";
  return `há ${diffD}d`;
}

export type StatusKind =
  | "pending"
  | "claimed"
  | "running"
  | "done"
  | "completed"
  | "failed"
  | "idle";

export const STATUS_META: Record<StatusKind, { label: string; className: string; dot: string }> = {
  pending: {
    label: "na fila",
    className: "border-amber-800 bg-amber-950 text-amber-300",
    dot: "bg-amber-400",
  },
  claimed: {
    label: "pego pelo worker",
    className: "border-sky-800 bg-sky-950 text-sky-300",
    dot: "bg-sky-400",
  },
  running: {
    label: "rodando",
    className: "border-sky-800 bg-sky-950 text-sky-300",
    dot: "bg-sky-400 animate-pulse",
  },
  done: {
    label: "concluída",
    className: "border-emerald-800 bg-emerald-950 text-emerald-300",
    dot: "bg-emerald-400",
  },
  completed: {
    label: "concluído",
    className: "border-emerald-800 bg-emerald-950 text-emerald-300",
    dot: "bg-emerald-400",
  },
  failed: {
    label: "falhou",
    className: "border-red-800 bg-red-950 text-red-300",
    dot: "bg-red-400",
  },
  idle: {
    label: "sem execução ainda",
    className: "border-neutral-700 bg-neutral-900 text-neutral-400",
    dot: "bg-neutral-600",
  },
};
