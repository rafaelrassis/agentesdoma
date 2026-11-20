# doma-dashboard

Painel de controle dos agentes da **Doma Baby** (Shopee BR). Next.js + Prisma + Postgres, publicado na Vercel.

Mostra status dos 4 agentes (`coletor`, `marketing`, `vendas`, `gerente`), último snapshot da loja, relatórios recentes e deixa enfileirar ordens pra eles. Cada ordem roda em um de dois destinos, escolhido no painel:

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

## Desenvolvimento

```bash
npm install
npx prisma generate
npm run dev
```

## Deploy

`npx prisma migrate deploy` roda como parte do `npm run build` na Vercel, assumindo `DATABASE_URL` configurado no projeto.
