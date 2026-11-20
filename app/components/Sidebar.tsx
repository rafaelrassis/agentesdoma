"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../actions";

const NAV = [
  { href: "/", label: "Visão geral", d: "M2 7.2 8 2.4l6 4.8V14H2z" },
  { href: "/alertas", label: "Alertas", d: "M8 2.5 14.5 13.5h-13zM8 6.4v3.2M8 11.5h.01" },
  { href: "/tarefas", label: "Tarefas", d: "M2.5 4.6 4 6.1l2.3-2.5M2.5 11.6 4 13.1l2.3-2.5M8.6 5h5M8.6 12h5" },
  { href: "/kanban", label: "Kanban", d: "M2.5 2.8h3.2v10.4H2.5zM6.9 2.8h3.2v6.6H6.9zM11.3 2.8h2.2v8.4h-2.2z" },
  { href: "/evolucao", label: "Evolução", d: "M2 12.4 6 7.2l3 2.6 5-6.2" },
  { href: "/reuniao", label: "Reunião", d: "M5.9 5.4a2.1 2.1 0 1 1 4.2 0 2.1 2.1 0 0 1-4.2 0M2.8 13.6c0-2.3 2.1-4.1 5.2-4.1s5.2 1.8 5.2 4.1" },
  { href: "/rotinas", label: "Rotinas", d: "M13.2 8a5.2 5.2 0 1 1-1.9-4M13.4 2.2v3.1h-3.1" },
] as const;

export function Sidebar({
  alertCount,
  workerOnline,
  workerSeen,
  cloudEnabled,
}: {
  alertCount: number;
  workerOnline: boolean;
  workerSeen: string | null;
  cloudEnabled: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* barra do celular: some a partir de md, onde a sidebar fica sempre visível */}
      <div className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-chip bg-brand text-[12px] font-bold text-white">
            DB
          </span>
          <span className="text-sm font-semibold text-ink-strong">Doma Baby</span>
        </div>
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line-strong text-ink-muted"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
            {open ? <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" /> : <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />}
          </svg>
        </button>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-canvas/70 md:hidden"
        />
      )}

      <nav
        aria-label="Navegação principal"
        className={`${
          open ? "flex fixed inset-y-0 left-0 z-50 w-[85%] max-w-[300px] overflow-y-auto bg-canvas" : "hidden"
        } flex-col gap-6 border-r border-line px-3.5 py-5 md:static md:z-auto md:flex md:min-w-[232px] md:max-w-[280px] md:flex-[1_1_248px] md:self-stretch md:overflow-visible md:bg-transparent`}
      >
        <div className="hidden items-center gap-2.5 px-1.5 md:flex">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-chip bg-brand text-[13px] font-bold text-white">
            DB
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink-strong">Doma Baby</span>
            <span className="block text-xs text-ink-muted">Shopee BR · claitinha</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="mb-1.5 ml-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Painel
          </p>
          {NAV.map((item) => {
            const active = pathname === item.href;
            const badge = item.href === "/alertas" ? alertCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-2.5 rounded-control px-2.5 text-[13.5px] transition-colors ${
                  active
                    ? "bg-raised font-semibold text-white shadow-[inset_2px_0_0_var(--color-brand)]"
                    : "font-medium text-ink-muted hover:bg-raised/60 hover:text-ink"
                }`}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                >
                  <path d={item.d} />
                </svg>
                <span className="min-w-0 flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="num inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full border border-block-line bg-block-bg px-1.5 text-[11px] font-semibold text-block-fg">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-2 rounded-chip border border-line p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Workers</p>
          <div className="flex items-center gap-2">
            <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${workerOnline ? "bg-ok" : "bg-idle"}`} />
            <span className="flex-1 text-[13px] text-ink">Local</span>
            <span className="num text-[11px] text-ink-faint">{workerOnline ? workerSeen : "offline"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${cloudEnabled ? "bg-ok" : "bg-idle"}`} />
            <span className="flex-1 text-[13px] text-ink">Cloud</span>
            <span className="text-[11px] text-ink-faint">{cloudEnabled ? "ligado" : "desligado"}</span>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-line-strong px-3 text-[13px] font-medium text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-[15px] w-[15px]"
            >
              <path d="M10 11.5 13.5 8 10 4.5M13.5 8H6M9 2.5H3.5v11H9" />
            </svg>
            Sair
          </button>
        </form>
      </nav>
    </>
  );
}
