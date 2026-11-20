# Worker do painel Doma Baby

Roda **na sua máquina** (não na Vercel — a Vercel não enxerga seu Chrome logado na Shopee). Puxa a fila de ordens do painel, dispara `claude -p` em `~/doma-agents` e sobe `out/*.md` e `data/*.json` de volta pro painel.

## Setup

```bash
cd ~/doma-agents/worker
cp .env.example .env
```

Preencha `.env`:
- `DASHBOARD_URL` — a URL do painel depois do deploy na Vercel
- `WORKER_TOKEN` — o mesmo valor que você configurar como `WORKER_TOKEN` nas env vars do projeto na Vercel

## Rodar

```bash
node worker.mjs
```

### Ligar com 1 clique

Com `.env` já preenchido, dá pra ligar sem abrir terminal: clique duplo em `worker/start.sh` no gerenciador de arquivos (se pedir, marque "permitir executar como programa" nas propriedades do arquivo) ou crie um atalho de desktop apontando pra ele. Ele não duplica processo se o worker já estiver rodando. Log fica em `worker/worker.log`.

Fica rodando em loop (poll a cada 15s por padrão), em primeiro plano. Pra deixar persistente:

```bash
# com systemd (usuário)
# crie ~/.config/systemd/user/doma-worker.service apontando pra "node ~/doma-agents/worker/worker.mjs"
systemctl --user enable --now doma-worker

# ou simplesmente em background com nohup
nohup node worker.mjs > worker.log 2>&1 &
```

## Aviso de segurança

`CLAUDE_PERMISSION_MODE=acceptEdits` (padrão) deixa o Claude Code aceitar edições de arquivo sozinho, mas ainda deveria barrar ações mais arriscadas. Se você mudar pra `bypassPermissions`, o worker roda os agentes **sem nenhuma confirmação humana** — inclusive o `coletor`, que mexe num navegador logado na sua conta real da Shopee. Só faça isso se confiar 100% nos prompts dos agentes (eles foram calibrados pra não alterar listagem durante o congelamento, mas nada impede um prompt mal formulado de testar os limites). Prefira manter `acceptEdits` ou configurar um allowlist fino em `~/doma-agents/.claude/settings.json`.
