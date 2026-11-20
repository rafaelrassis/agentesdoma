"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-neutral-100">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl shadow-black/20"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-sm font-semibold text-rose-300">
            DB
          </span>
          <div>
            <h1 className="text-base font-semibold text-neutral-50">Doma Baby</h1>
            <p className="text-xs text-neutral-400">Painel de agentes</p>
          </div>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Senha"
          autoFocus
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-rose-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-rose-500 px-3 py-2 font-medium text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
