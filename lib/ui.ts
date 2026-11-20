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

/**
 * A string "null" nunca chega à tela. Use em todo valor que vem do snapshot.
 *   dash(loja?.vendas_totais)            -> "0" | "—"
 *   dash(loja?.conversao, (v) => `${v}%`) -> "0%" | "—"
 */
export function dash<T>(value: T | null | undefined, format?: (v: T) => string) {
  if (value === null || value === undefined || value === "") return "—";
  return format ? format(value) : String(value);
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
    className: "border-warn-line bg-warn-bg text-warn-fg",
    dot: "bg-warn",
  },
  claimed: {
    label: "pego pelo worker",
    className: "border-run-line bg-run-bg text-run-fg",
    dot: "bg-run",
  },
  running: {
    label: "rodando",
    className: "border-run-line bg-run-bg text-run-fg",
    dot: "bg-run animate-pulse",
  },
  done: {
    label: "concluída",
    className: "border-ok-line bg-ok-bg text-ok-fg",
    dot: "bg-ok",
  },
  completed: {
    label: "concluído",
    className: "border-ok-line bg-ok-bg text-ok-fg",
    dot: "bg-ok",
  },
  failed: {
    label: "falhou",
    className: "border-fail-line bg-fail-bg text-fail-fg",
    dot: "bg-fail",
  },
  idle: {
    label: "sem execução",
    className: "border-idle-line bg-idle-bg text-idle-fg",
    dot: "bg-idle",
  },
};
