# doma-dashboard

Painel de controle dos agentes da **Doma Baby** (Shopee BR). Next.js + Prisma + Postgres, publicado na Vercel.

Mostra status dos 4 agentes (`coletor`, `marketing`, `vendas`, `gerente`), último snapshot da loja, relatórios recentes e deixa enfileirar ordens pra eles — manualmente ou por rotina recorrente (tela `/rotinas`). Cada ordem roda em um de dois destinos, escolhido no painel:

- **local** — um worker (`worker/worker.mjs`) rodando na sua máquina puxa a fila, dispara `claude -p` em `~/doma-agents` e sincroniza `out/*.md` e `data/*.json` de volta. Único jeito de rodar o `coletor` (depende do seu Chrome logado na Shopee).
- **cloud** — uma sessão Claude Code Remote persistente, acordada por um scheduled trigger, processa a ordem sem precisar do seu PC. Só funciona bem para `marketing`, `vendas` e `gerente` (sem navegador); o `coletor` em nuvem ainda falha até existir um fluxo de login da Shopee sem o seu Chrome.

Os agentes (`CLAUDE.md`, `.claude/agents/`, `data/`, `worker/`) vivem neste mesmo repositório, na raiz.

## Stack

- Next.js (App Router) + Tailwind
- Prisma + PostgreSQL
- Deploy: Vercel

## Variáveis de ambiente

| Nome | Uso |
|---|---|
| `DATABASE_URL` | connection string do Postgres |
| `DASHBOARD_PASSWORD` | senha de acesso ao painel (login simples por cookie) |
| `WORKER_TOKEN` | token Bearer que o worker local usa para falar com `/api/worker/*` |
| `CRON_SECRET` | secret que autentica o cron da Vercel em `/api/cron/routines`. Defina essa env var no projeto da Vercel — ela adiciona sozinha o header `Authorization: Bearer $CRON_SECRET` nas chamadas de cron |

## Rotinas

Em `/rotinas` dá pra cadastrar uma rotina (agente + prompt + destino + frequência em dias). Um cron na Vercel (`vercel.json`, `/api/cron/routines`, roda 1x/dia — limite do plano Hobby) confere quais rotinas estão vencidas e cria uma ordem normal na fila pra elas — mesmo fluxo de "Nova ordem" do painel. Cada execução ainda passa pelas regras do agente (`CLAUDE.md`), incluindo o congelamento de 14 dias: a rotina só dispara o agente, ela não ignora as regras dele.

## Desenvolvimento

```bash
npm install
npx prisma generate
npm run dev
```

## Deploy

`npx prisma migrate deploy` roda como parte do `npm run build` na Vercel, assumindo `DATABASE_URL` configurado no projeto.
