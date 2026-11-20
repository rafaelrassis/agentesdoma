#!/usr/bin/env node
// Scraper headless pro coletor em nuvem. Roda numa sandbox cloud (Playwright
// pré-instalado), carrega a sessão Shopee salva no painel (storageState) e
// dumpa o texto visível das páginas-alvo em arquivos, pro subagente
// coletor-cloud interpretar. Não decide nada sozinho: só coleta texto bruto.
//
// Uso: DASHBOARD_URL=... WORKER_TOKEN=... node scripts/coletor-cloud.mjs

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const DASHBOARD_URL = (process.env.DASHBOARD_URL ?? "").replace(/\/$/, "");
const WORKER_TOKEN = process.env.WORKER_TOKEN ?? "";
const OUT_DIR = process.env.CLOUD_COLETOR_OUT_DIR ?? ".cloud-coletor/raw";
const MAX_PAGINATE_PAGES = 30;

if (!DASHBOARD_URL || !WORKER_TOKEN) {
  console.error(
    JSON.stringify({ error: "DASHBOARD_URL e WORKER_TOKEN são obrigatórios" })
  );
  process.exit(1);
}

const TARGETS = [
  { label: "painel-geral", url: "https://seller.shopee.com.br/", paginate: false },
  { label: "pedidos", url: "https://seller.shopee.com.br/portal/sale/order", paginate: false },
  {
    label: "produtos",
    url: "https://seller.shopee.com.br/portal/product/list/all",
    paginate: true,
  },
  {
    label: "saude-conta",
    url: "https://seller.shopee.com.br/portal/settings/shop/account-health",
    paginate: false,
  },
  {
    label: "canais-envio",
    url: "https://seller.shopee.com.br/portal/all-settings/shipping/shipping-channel",
    paginate: false,
  },
  {
    label: "melhor-oferta",
    url: "https://seller.shopee.com.br/portal/marketing/realtime-bidding/list",
    paginate: false,
  },
];

function isLoggedOut(currentUrl) {
  try {
    const u = new URL(currentUrl);
    return u.hostname !== "seller.shopee.com.br" || /login|signin|account\.shopee/i.test(currentUrl);
  } catch {
    return true;
  }
}

async function clickNextPage(page) {
  const candidates = page.locator(
    'button:not([disabled]):has-text("Próxima"), button:not([disabled]):has-text("próxima"), [aria-label*="next" i]:not([disabled]), [aria-label*="próxim" i]:not([disabled])'
  );
  const count = await candidates.count().catch(() => 0);
  if (count === 0) return false;
  try {
    await candidates.first().click({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.error(JSON.stringify({ error: "playwright não disponível nesta sandbox" }));
    process.exit(1);
  }

  const sessionRes = await fetch(`${DASHBOARD_URL}/api/worker/settings/session`, {
    headers: { authorization: `Bearer ${WORKER_TOKEN}` },
  });
  if (!sessionRes.ok) {
    console.error(
      JSON.stringify({ error: `sem sessão salva (${sessionRes.status})` })
    );
    process.exit(1);
  }
  const { storageState } = await sessionRes.json();

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  const manifest = [];
  let loginRequired = false;

  for (const target of TARGETS) {
    await page.goto(target.url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);

    if (isLoggedOut(page.url())) {
      loginRequired = true;
      manifest.push({ label: target.label, url: target.url, loginRequired: true });
      continue;
    }

    let combinedText = await page.evaluate(() => document.body.innerText).catch(() => "");
    let pagesCaptured = 1;

    if (target.paginate) {
      for (let i = 1; i < MAX_PAGINATE_PAGES; i++) {
        const clicked = await clickNextPage(page);
        if (!clicked) break;
        await page.waitForTimeout(1500);
        const nextText = await page.evaluate(() => document.body.innerText).catch(() => "");
        if (!nextText || nextText === combinedText) break;
        combinedText += `\n\n--- página ${i + 1} ---\n\n${nextText}`;
        pagesCaptured++;
      }
    }

    const filePath = join(OUT_DIR, `${target.label}.txt`);
    writeFileSync(filePath, combinedText, "utf8");
    manifest.push({
      label: target.label,
      url: target.url,
      file: filePath,
      chars: combinedText.length,
      pagesCaptured,
    });
  }

  await browser.close();

  console.log(JSON.stringify({ loginRequired, manifest }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
