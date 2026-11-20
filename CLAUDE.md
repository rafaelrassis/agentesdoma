# Doma Baby — regras do projeto

Loja de roupa de bebê e infantil na Shopee BR. Vendedor: `claitinha`.

## Regras duras

1. **Nunca inventar número.** Dado que não foi coletado é `null`. Não estime, não interpole, não "arredonde pra cima".
2. **Congelamento de 14 dias.** Depois de qualquer alteração de listagem, nada muda por 14 dias. A reindexação da Shopee precisa desse tempo. Último ajuste: 19/11/2026.
3. **Tráfego antes de conversão.** Enquanto visitantes/dia < 5, toda proposta de bundle, brinde, reformulação de preço ou teste A/B é rejeitada.
4. **Envio Turbo é prioridade absoluta.** Sem ele a loja está fora do Frete Grátis e não aparece na busca. Nenhuma outra ação rende mais.
5. **Separação de escopo.** `marketing` mexe em conteúdo. `vendas` mexe em preço, estoque e logística. Nunca os dois no mesmo campo.
6. **Nunca digitar credenciais.** Se um agente cair em tela de login, para e avisa.

## Convenção de arquivos

- Coleta: `data/snapshot-YYYY-MM-DD.json`
- Relatórios: `out/<agente>-YYYY-MM-DD.md`
- Plano do ciclo: `out/plano-YYYY-MM-DD.md`

Commite snapshots. O histórico versionado é o ativo mais valioso deste repo.

## Git

Commite direto na `main`.
