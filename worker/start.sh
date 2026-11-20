#!/bin/bash
# Liga o worker da Doma Baby com um clique (duplo clique no gerenciador de arquivos,
# ou "bash start.sh" no terminal). Não derruba nem duplica se já estiver rodando.
cd "$(dirname "$0")" || exit 1

if pgrep -f "node .*worker\.mjs" > /dev/null; then
  echo "Worker já está rodando."
  exit 0
fi

if [ ! -f .env ]; then
  echo "Falta worker/.env — copie .env.example e preencha antes de rodar."
  exit 1
fi

nohup node worker.mjs >> worker.log 2>&1 &
disown
echo "Worker iniciado (PID $!). Logs em worker/worker.log"
