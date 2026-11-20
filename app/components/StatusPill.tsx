import { STATUS_META, type StatusKind } from "@/lib/ui";

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status as StatusKind] ?? {
    label: status,
    className: "border-neutral-700 bg-neutral-900 text-neutral-400",
    dot: "bg-neutral-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
