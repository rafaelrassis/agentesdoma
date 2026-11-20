import { prisma } from "./db";

export type AlertItem = {
  id: string;
  severity: "critical" | "warning";
  title: string;
  detail: string;
};

const WORKER_OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;
const LOGIN_KEYWORDS = ["login", "credencial", "sessão expirou", "sessao expirou", "não está logad", "nao esta logad"];

export async function getAlerts() {
  const [failedOrders, latestSnapshot, workerHeartbeat] = await Promise.all([
    prisma.order.findMany({ where: { status: "failed" }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.snapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.workerHeartbeat.findUnique({ where: { target: "local" } }),
  ]);

  const data = latestSnapshot?.data as Record<string, any> | undefined;
  const items: AlertItem[] = [];

  const loginWall = failedOrders.filter((o) =>
    LOGIN_KEYWORDS.some((k) => (o.result ?? "").toLowerCase().includes(k))
  );
  if (loginWall.length > 0) {
    items.push({
      id: "login-wall",
      severity: "critical",
      title: "Agente caiu em tela de login",
      detail: `${loginWall.length} ordem(ns) pararam porque a sessão da Shopee não está logada. Logue de novo e rode a ordem de novo.`,
    });
  }

  const penalidades: unknown[] = Array.isArray(data?.saude_conta?.penalidades)
    ? data.saude_conta.penalidades
    : [];
  if (penalidades.length > 0) {
    items.push({
      id: "penalidades",
      severity: "critical",
      title: `${penalidades.length} penalidade(s) na conta`,
      detail: penalidades.map((p) => String(p)).join("; "),
    });
  }

  if (data?.logistica && data.logistica.envio_turbo === false) {
    items.push({
      id: "envio-turbo",
      severity: "critical",
      title: "Envio Turbo bloqueado",
      detail: "Sem ele a loja sai do Frete Grátis e some da busca. Prioridade máxima segundo o CLAUDE.md.",
    });
  }

  const produtos: any[] = Array.isArray(data?.produtos) ? data.produtos : [];
  const semEstoque = produtos.filter((p) => p?.estoque === 0);
  if (semEstoque.length > 0) {
    items.push({
      id: "estoque-zero",
      severity: "warning",
      title: `${semEstoque.length} produto(s) sem estoque`,
      detail: semEstoque
        .map((p) => p?.nome)
        .filter(Boolean)
        .join(", "),
    });
  }

  const workerOffline =
    !workerHeartbeat || Date.now() - workerHeartbeat.lastSeenAt.getTime() > WORKER_OFFLINE_THRESHOLD_MS;
  if (workerOffline) {
    items.push({
      id: "worker-offline",
      severity: "warning",
      title: "Worker local offline",
      detail: workerHeartbeat
        ? `Último sinal há mais de ${Math.round(
            (Date.now() - workerHeartbeat.lastSeenAt.getTime()) / 60000
          )} min. Ordens locais param de processar.`
        : "Nunca recebeu um heartbeat. Ordens locais não vão ser processadas.",
    });
  }

  const outrosFalhados = failedOrders.filter((o) => !loginWall.includes(o));

  return { items, failedOrders, outrosFalhados, semEstoque, penalidades };
}
