#!/usr/bin/env node
// Worker do painel Doma Baby.
// Roda local (nesta máquina), puxa a fila de ordens do dashboard na Vercel,
// dispara `claude -p` em ~/doma-agents e sincroniza out/*.md e data/*.json de volta.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, ".env");

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(ENV_PATH)) {
    for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in env)) env[key] = value;
    }
  }
  return env;
}

const env = loadEnv();

const DASHBOARD_URL = (env.DASHBOARD_URL ?? "").replace(/\/$/, "");
const WORKER_TOKEN = env.WORKER_TOKEN ?? "";
const DOMA_DIR = env.DOMA_DIR ?? join(__dirname, "..");
const POLL_INTERVAL_MS = Number(env.POLL_INTERVAL_MS ?? 15000);
const PERMISSION_MODE = env.CLAUDE_PERMISSION_MODE ?? "acceptEdits";
const MAX_RESULT_CHARS = 6000;

if (!DASHBOARD_URL || !WORKER_TOKEN) {
  console.error(
    "Faltam DASHBOARD_URL e/ou WORKER_TOKEN. Copie worker/.env.example para worker/.env e preencha."
  );
  process.exit(1);
}

const SYNCED_STATE_PATH = join(__dirname, ".synced.json");
function loadSyncedState() {
  if (!existsSync(SYNCED_STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SYNCED_STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}
function saveSyncedState(state) {
  try {
    writeFileSync(SYNCED_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Falha ao salvar estado de sincronização:", err.message);
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${DASHBOARD_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${WORKER_TOKEN}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status} ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

function runClaude(prompt, model) {
  const args = ["-p", prompt, "--permission-mode", PERMISSION_MODE];
  if (model) args.push("--model", model);
  return new Promise((resolve) => {
    execFile(
      "claude",
      args,
      { cwd: DOMA_DIR, maxBuffer: 1024 * 1024 * 10, timeout: 1000 * 60 * 20 },
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          output: (stdout || "") + (stderr ? `\n[stderr]\n${stderr}` : ""),
          error: error?.message,
        });
      }
    );
  });
}

function truncate(text, max = MAX_RESULT_CHARS) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max)}\n…(truncado)` : text;
}

async function processOrder(order) {
  console.log(`[ordem ${order.id}] ${order.agent}: ${order.prompt}`);
  await api(`/api/worker/orders/${order.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "claimed" }),
  });

  const { run } = await api(`/api/worker/runs`, {
    method: "POST",
    body: JSON.stringify({ agent: order.agent, orderId: order.id }),
  });

  await api(`/api/worker/orders/${order.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "running" }),
  });

  const fullPrompt = `use o agente ${order.agent} para: ${order.prompt}`;
  const result = await runClaude(fullPrompt, order.model);

  await api(`/api/worker/orders/${order.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: result.ok ? "done" : "failed",
      result: truncate(result.output || result.error || ""),
    }),
  });

  await api(`/api/worker/runs/${run.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: result.ok ? "completed" : "failed",
      summary: truncate(result.output || result.error || "", 1000),
    }),
  });

  console.log(`[ordem ${order.id}] ${result.ok ? "concluída" : "falhou"}`);
}

function listFilesRecursive(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push({ path: full, mtimeMs: stat.mtimeMs });
  }
  return out;
}

const TAREFA_LINE = /^-\s*\[(\w+)\]\s*(.+)$/;

async function syncTarefasPropostas(content) {
  for (const line of content.split("\n")) {
    const match = line.trim().match(TAREFA_LINE);
    if (!match) continue;
    const [, agent, title] = match;
    try {
      const { created } = await api(`/api/worker/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), createdBy: agent }),
      });
      if (created) console.log(`[sync] tarefa proposta por ${agent}: ${title.trim()}`);
    } catch (err) {
      console.error(`[sync] falha ao enviar tarefa (${agent}):`, err.message);
    }
  }
}

async function syncFiles() {
  const state = loadSyncedState();

  const outDir = join(DOMA_DIR, "out");
  for (const file of listFilesRecursive(outDir)) {
    if (!file.path.endsWith(".md")) continue;
    if (state[file.path] === file.mtimeMs) continue;
    const content = readFileSync(file.path, "utf8");
    const relPath = file.path.replace(`${DOMA_DIR}/`, "");
    const fileName = relPath.split("/").pop();

    if (fileName === "tarefas-propostas.md") {
      await syncTarefasPropostas(content);
      state[file.path] = file.mtimeMs;
      continue;
    }

    const agent = fileName.startsWith("plano-") ? "gerente" : fileName.split("-")[0];
    const dateMatch = relPath.match(/(\d{4}-\d{2}-\d{2})/);
    try {
      await api(`/api/worker/reports`, {
        method: "POST",
        body: JSON.stringify({
          agent,
          date: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
          path: relPath,
          content,
        }),
      });
      state[file.path] = file.mtimeMs;
      console.log(`[sync] relatório enviado: ${relPath}`);
    } catch (err) {
      console.error(`[sync] falha ao enviar ${relPath}:`, err.message);
    }
  }

  const dataDir = join(DOMA_DIR, "data");
  for (const file of listFilesRecursive(dataDir)) {
    if (!file.path.endsWith(".json")) continue;
    if (state[file.path] === file.mtimeMs) continue;
    try {
      const data = JSON.parse(readFileSync(file.path, "utf8"));
      const dateMatch = file.path.match(/(\d{4}-\d{2}-\d{2})/);
      await api(`/api/worker/snapshots`, {
        method: "POST",
        body: JSON.stringify({
          date: data.data ?? (dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10)),
          data,
        }),
      });
      state[file.path] = file.mtimeMs;
      console.log(`[sync] snapshot enviado: ${file.path}`);
    } catch (err) {
      console.error(`[sync] falha ao enviar ${file.path}:`, err.message);
    }
  }

  saveSyncedState(state);
}

async function sendHeartbeat() {
  try {
    await api(`/api/worker/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ target: "local" }),
    });
  } catch (err) {
    console.error("[worker] falha no heartbeat:", err.message);
  }
}

async function tick() {
  try {
    await sendHeartbeat();
    await syncFiles();
    const { orders } = await api(`/api/worker/orders?target=local`);
    for (const order of orders) {
      await processOrder(order);
    }
    if (orders.length > 0) await syncFiles();
  } catch (err) {
    console.error("[worker] erro no ciclo:", err.message);
  }
}

console.log(`Worker Doma Baby iniciado. Painel: ${DASHBOARD_URL} · diretório: ${DOMA_DIR}`);
console.log(`Permission mode do claude: ${PERMISSION_MODE}`);

async function loop() {
  while (true) {
    await tick();
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

loop();
