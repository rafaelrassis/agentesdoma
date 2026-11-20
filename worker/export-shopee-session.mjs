#!/usr/bin/env node
// Captura a sessão logada da Shopee (cookies + storage) e envia pro painel,
// pra uso pelo coletor-cloud (Playwright headless numa sandbox cloud).
//
// Requer Playwright instalado localmente: npm install -D playwright
// (e, na primeira vez, `npx playwright install chromium`).
//
// Roda com o mesmo worker/.env do worker.mjs (DASHBOARD_URL, WORKER_TOKEN).

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

if (!DASHBOARD_URL || !WORKER_TOKEN) {
  console.error("Faltam DASHBOARD_URL e/ou WORKER_TOKEN em worker/.env.");
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "Playwright não encontrado. Rode: npm install -D playwright && npx playwright install chromium"
  );
  process.exit(1);
}

console.log("Abrindo um Chrome de verdade. Faça login na Shopee Seller Center normalmente.");
console.log("Depois de logar e ver o painel (seller.shopee.com.br), volte aqui e aperte Enter.");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("https://seller.shopee.com.br/");

await new Promise((resolve) => {
  process.stdin.setEncoding("utf8");
  process.stdin.once("data", resolve);
  process.stdin.resume();
});

const storageState = await context.storageState();
await browser.close();

const res = await fetch(`${DASHBOARD_URL}/api/worker/settings/session`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${WORKER_TOKEN}`,
  },
  body: JSON.stringify({ storageState }),
});

if (!res.ok) {
  console.error(`Falha ao enviar sessão: ${res.status} ${await res.text()}`);
  process.exit(1);
}

console.log("Sessão enviada. Lembre de ligar 'Coletor em nuvem' no painel.");
console.log(
  "Aviso: essa sessão fica salva no banco do painel. Quem tiver o WORKER_TOKEN age como você na Shopee."
);
