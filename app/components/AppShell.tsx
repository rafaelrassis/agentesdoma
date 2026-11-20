import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { getAlerts } from "@/lib/alerts";
import { relativeTime } from "@/lib/ui";
import { Sidebar } from "./Sidebar";

const WORKER_ONLINE_THRESHOLD_MS = 35_000;

/**
 * Único shell do painel. Toda página é envolvida por ele — é o que acaba com a
 * fileira de NavLink no header e com os "Voltar ao painel" espalhados.
 *
 * O status dos workers e a contagem de alertas são buscados aqui, não em cada
 * página, pra que a sidebar diga a mesma coisa em todas elas.
 */
export async function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [alerts, heartbeat, cloudSettings] = await Promise.all([
    getAlerts(),
    prisma.workerHeartbeat.findUnique({ where: { target: "local" } }),
    prisma.cloudSettings.findUnique({ where: { id: 1 } }),
  ]);

  const workerOnline =
    !!heartbeat && Date.now() - heartbeat.lastSeenAt.getTime() < WORKER_ONLINE_THRESHOLD_MS;

  return (
    <div className="flex min-h-screen flex-wrap items-start">
      <Sidebar
        alertCount={alerts.items.length}
        workerOnline={workerOnline}
        workerSeen={relativeTime(heartbeat?.lastSeenAt)}
        cloudEnabled={!!cloudSettings?.coletorCloudEnabled}
      />

      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 px-7 pb-16 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-[650] tracking-[-0.015em] text-ink-strong">{title}</h1>
            {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
