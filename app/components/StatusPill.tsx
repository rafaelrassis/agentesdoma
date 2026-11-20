import { STATUS_META, type StatusKind } from "@/lib/ui";

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status as StatusKind] ?? STATUS_META.idle;
  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-full border px-2.5 py-[5px] text-xs font-semibold ${meta.className}`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/** Só o ponto, para linhas de lista onde o rótulo já está no texto. */
export function StatusDot({ status, className = "" }: { status: string; className?: string }) {
  const meta = STATUS_META[status as StatusKind] ?? STATUS_META.idle;
  return <span aria-label={meta.label} className={`h-2 w-2 shrink-0 rounded-full ${meta.dot} ${className}`} />;
}
