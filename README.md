# doma-dashboard

Painel de controle dos agentes da **Doma Baby** (Shopee BR). Next.js + Prisma + Postgres, publicado na Vercel.

Mostra status dos 4 agentes (`coletor`, `marketing`, `vendas`, `gerente`), último snapshot da loja, relatórios recentes e deixa enfileirar ordens pra eles. Um worker rodando na máquina local (`~/doma-agents/worker`) puxa essa fila, dispara `claude -p` e sincroniza os arquivos de volta.

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
