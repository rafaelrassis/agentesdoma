"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Button, controlClass } from "../components/ui";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-card border border-line bg-surface p-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chip bg-brand text-sm font-bold text-white">
            DB
          </span>
          <div>
            <h1 className="m-0 text-base font-semibold text-ink-strong">Doma Baby</h1>
            <p className="m-0 text-xs text-ink-muted">Painel de agentes</p>
          </div>
        </div>
        <label className="mt-5 flex flex-col gap-1.5 text-xs text-ink-muted">
          Senha
          <input type="password" name="password" autoFocus className={controlClass} />
        </label>
        {error && <p className="mt-3 text-sm text-fail-fg">{error}</p>}
        <Button variant="primary" type="submit" disabled={pending} className="mt-5 w-full">
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
