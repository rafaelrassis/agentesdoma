import type { ReactNode } from "react";

/* Primitivos do painel. Nenhum componente fora deste arquivo escreve cor,
   raio ou borda direto — tudo passa por aqui ou pelos tokens do globals.css. */

export function Card({
  title,
  badge,
  action,
  padded = true,
  children,
}: {
  title?: string;
  badge?: string;
  action?: ReactNode;
  /** false quando o conteúdo é uma lista com divisórias de borda a borda */
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface">
      {title && (
        <div className={`flex items-center justify-between gap-2.5 px-[18px] pt-[18px] ${padded ? "" : "pb-0"}`}>
          <div className="flex items-center gap-2.5">
            <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full border border-line-strong px-[7px] py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                {badge}
              </span>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? "p-[18px]" : ""}>{children}</div>
    </section>
  );
}

/** KPI. `value` já vem formatado; passe `null` e ele mostra `—`, nunca "null". */
export function Stat({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string | number | null | undefined;
  note?: string;
  tone?: "default" | "warn" | "fail" | "ok";
}) {
  const empty = value === null || value === undefined || value === "";
  const toneClass = empty
    ? "text-ink-faint"
    : tone === "warn"
      ? "text-warn-fg"
      : tone === "fail"
        ? "text-fail-fg"
        : tone === "ok"
          ? "text-ok-fg"
          : "text-ink-strong";

  return (
    <div className="min-w-0 flex-[1_1_172px] rounded-card border border-line bg-surface p-[18px]">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">{label}</p>
      <p className={`num mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] ${toneClass}`}>
        {empty ? "—" : String(value)}
      </p>
      {note && <p className="mt-1.5 text-xs text-ink-faint">{note}</p>}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <section className="flex flex-wrap gap-3">{children}</section>;
}

/** Bloqueio crítico. Único elemento da página com cor de alerta em área grande. */
export function Blocker({
  title,
  children,
  actionHref,
  actionLabel,
}: {
  title: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="flex flex-wrap items-center gap-3.5 rounded-card border border-block-line bg-block-bg px-[18px] py-4">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-chip bg-block-line/40">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
          className="h-[17px] w-[17px] text-block"
        >
          <path d="M8 2.5 14.5 13.5h-13zM8 6.5v3.2M8 11.6h.01" />
        </svg>
      </span>
      <div className="min-w-0 flex-[999_1_320px]">
        <h2 className="m-0 text-sm font-semibold text-block-fg">{title}</h2>
        <p className="mt-1 text-[13px] text-block-fg/70">{children}</p>
      </div>
      {actionHref && actionLabel && (
        <a
          href={actionHref}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-block-line bg-block-line/25 px-3.5 text-[13px] font-semibold text-block-fg transition-colors hover:bg-block-line/40"
        >
          {actionLabel}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </a>
      )}
    </section>
  );
}

const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-[13px] transition-colors disabled:opacity-50";

const BUTTON_VARIANT = {
  primary: "border border-transparent bg-brand font-semibold text-white hover:bg-brand-hover",
  secondary: "border border-line-strong bg-surface font-medium text-ink-muted hover:border-ink-faint hover:text-ink",
  danger: "border border-fail-line bg-fail-bg font-semibold text-fail-fg hover:bg-fail-line/40",
  quiet: "border-0 bg-transparent px-3 font-semibold text-brand-soft hover:text-ink",
} as const;

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_VARIANT }) {
  return (
    <button {...rest} className={`${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs text-ink-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}

export const controlClass =
  "w-full min-h-11 rounded-control border border-line-strong bg-sunken px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand-soft";

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-[13px] text-ink-muted">{children}</p>
      {action}
    </div>
  );
}

/** Texto longo que não deve ocupar a dobra. */
export function Explainer({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">{summary}</summary>
      <div className="mt-2 text-xs leading-relaxed text-ink-muted">{children}</div>
    </details>
  );
}
