# Prova de que um usuário não enxerga os dados de outro

Data: 2026-08-07
Projeto Supabase: `nrcdacxpeexpvqimwvvr` (financas-pessoais)

## Por que este documento existe

A interface do app não é prova de segurança. Se as políticas do banco
estiverem frouxas, um erro de programação — um `select` sem filtro — vaza os
dados de todo mundo, e a tela continua parecendo normal.

Então a verificação foi feita **por fora do app**, batendo direto na API do
Supabase com o token de cada usuário, do jeito que um invasor faria.

## Como foi testado

Dois usuários descartáveis foram criados:

- **A** — `verifica-gatilho@exemplo.com`
- **B** — `teste-b@exemplo.com`

O usuário A criou um lançamento de R$ 123,45 com a descrição
"lancamento do usuario A". Depois, com o token de B, tentei de tudo.

## Resultados

| # | Tentativa | Esperado | Obtido |
|---|---|---|---|
| 1 | B lista os lançamentos | não ver nada de A | `[]` ✅ |
| 2 | B grava um lançamento em nome de A | recusa | `HTTP 403` ✅ |
| 3 | B apaga o lançamento de A | não apagar | o registro de A continua lá ✅ |
| 4 | Requisição sem token, só com a chave pública | não ver nada | `[]` ✅ |
| 5 | B lê uma categoria de A pelo id | não ver | `[]` ✅ |
| 6 | B cria um cartão em nome de A | recusa | `HTTP 403` ✅ |
| 7 | B cria um orçamento em nome de A | recusa | `HTTP 403` ✅ |
| 8 | B lista as próprias categorias | ver as 32 dele | `32` ✅ |

O item 8 é o contraponto necessário: sem ele, uma política que simplesmente
negasse tudo passaria nos sete primeiros testes e o app não funcionaria. Ele
prova que a regra filtra pelo dono, em vez de bloquear todo mundo.

## O que garante isso

Todas as sete tabelas têm Row Level Security ativa, com a política:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

- `using` controla o que a pessoa **enxerga** (itens 1, 3, 4, 5)
- `with check` controla o que a pessoa **grava** (itens 2, 6, 7)

Faltar o `with check` é o erro clássico: a pessoa não vê os dados de outro,
mas consegue escrever no nome dele. Por isso os dois estão presentes.

## Linter de segurança do Supabase

`get_advisors type=security` retornou **zero avisos** depois da migração
`0004_endurece_funcoes.sql`, que corrigiu dois problemas encontrados:

1. `set_updated_at` estava com `search_path` mutável
2. `handle_new_user` era `SECURITY DEFINER` e estava **exposta como endpoint
   público** em `/rest/v1/rpc/handle_new_user` — qualquer pessoa poderia
   chamá-la. O `EXECUTE` foi revogado de `anon` e `authenticated`; o gatilho
   continua funcionando porque gatilhos não dependem do privilégio de quem
   chama.

## Limpeza

Os dois usuários de teste foram apagados depois da verificação.

## Observação sobre confirmação de e-mail

O projeto está com "Confirm email" **ligado**. Para esta prova, os dois
usuários de teste foram confirmados diretamente no banco. A decisão de manter
ou desligar essa exigência para o uso real ficou pendente com o dono do app.
