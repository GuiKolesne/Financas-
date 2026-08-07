# App de Finanças Pessoais — Fase 1

Data: 2026-08-07
Status: aprovado

## Objetivo

Substituir a planilha `Planilha_Clareza_Financeira_2026` por um aplicativo web
de finanças pessoais. A Fase 1 entrega o núcleo: autenticação, transações,
cartões de crédito com parcelamento, orçamentos por categoria, dashboard
didático e o simulador de compra à vista × parcelada.

O app é para uso individual: cada usuário vê apenas os próprios dados.

Público: pessoas sem formação em finanças. Toda a interface usa português
claro, sem jargão. Todo número exibido tem explicação disponível.

## Fora do escopo da Fase 1

Registrado aqui para evitar ambiguidade — estes itens **não** são construídos
nesta fase:

- Leitor inteligente de notificações bancárias e importação OFX/CSV (Fase 2)
- Metas de poupança, controle de dívidas, carteira de investimentos e cálculo
  FIRE (Fase 3)
- Exportação de relatórios em PDF
- Migração dos dados históricos da planilha — o app começa vazio, por decisão
  do usuário
- Transações recorrentes que se lançam sozinhas. O campo `is_recurring` existe
  e alimenta a previsão de saldo, mas nenhum job cria lançamentos
  automaticamente

## Pilha de tecnologia

- **Next.js 15** (App Router, TypeScript) — Server Components buscam dados;
  Server Actions processam formulários
- **Tailwind CSS 4** — estilos
- **Supabase** — Postgres, Auth (e-mail/senha + Google OAuth) e RLS. Projeto
  Supabase **novo e dedicado**, separado do projeto existente do sistema de
  esquadrias
- **Recharts** — gráficos (pizza e linha)
- **Zod** — validação de formulários
- **Vitest** — testes unitários dos módulos de cálculo
- **Vercel** — publicação

### Por que Server Components + RLS

A alternativa considerada foi um SPA client-side com `supabase-js` no
navegador. Descartada por três motivos: a lógica de cálculo iria toda para o
navegador, cada tela mostraria estado de carregamento no celular, e a Fase 2
não teria onde esconder a chave da API do LLM.

Com RLS ativa, mesmo um bug no código que peça "todas as transações" só
recebe as do usuário logado. A garantia fica no banco, não na disciplina de
quem escreve o código.

## Modelo de dados

Todas as tabelas têm `user_id uuid references auth.users`, `created_at` e
`updated_at`. Todas têm RLS ativa com política `auth.uid() = user_id` para
SELECT, INSERT, UPDATE e DELETE.

### Decisões transversais

**Valores monetários são inteiros em centavos.** `amount_cents integer`. Evita
erro de ponto flutuante (`0.1 + 0.2 = 0.30000000000000004`). A conversão para
`R$ 1.234,56` acontece só na exibição.

**Receitas e despesas na mesma tabela**, separadas pelo campo `type`. A
planilha usa abas separadas; unificar simplifica dashboard, filtros e o cálculo
de saldo.

### `profiles`

Criada por trigger em `auth.users` no cadastro.

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `display_name` | text | |
| `currency` | text | default `'BRL'` |

### `categories`

Semeadas no cadastro com as 32 categorias da planilha — 21 de despesa e 11 de
receita — com emojis (🏠 Moradia, 🛒 Supermercado, 💼 Salário...). O usuário
pode editar, adicionar e remover.

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `emoji` | text | |
| `color` | text | hex, usado nos gráficos |
| `type` | enum | `income` \| `expense` |
| `is_archived` | boolean | categoria com transações não é excluída, é arquivada |

### `credit_cards`

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `nickname` | text | ex: "Nubank roxinho" |
| `brand` | text | visa, mastercard, elo... |
| `limit_cents` | integer | |
| `closing_day` | smallint | 1–31, dia do fechamento da fatura |
| `due_day` | smallint | 1–31, dia do vencimento |
| `color` | text | |

Quando o dia configurado não existe no mês (fechamento dia 31 em fevereiro),
usa-se o último dia do mês.

### `installment_plans`

A "compra-mãe" de uma compra parcelada.

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `description` | text | |
| `total_cents` | integer | |
| `installments_count` | smallint | |
| `purchase_date` | date | |
| `credit_card_id` | uuid FK | |
| `category_id` | uuid FK | |

Editar ou excluir a compra-mãe afeta todas as parcelas filhas
(`on delete cascade`).

### `transactions`

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `date` | date | data de competência da parcela/lançamento |
| `amount_cents` | integer | sempre positivo; o sinal vem de `type` |
| `type` | enum | `income` \| `expense` |
| `category_id` | uuid FK | |
| `description` | text | |
| `payment_method` | enum | `pix` \| `debit` \| `cash` \| `credit` |
| `credit_card_id` | uuid FK null | obrigatório quando `payment_method = 'credit'` |
| `installment_plan_id` | uuid FK null | preenchido nas parcelas geradas |
| `installment_number` | smallint null | 1..N |
| `is_recurring` | boolean | alimenta a previsão de saldo |

### `import_batches`

Criada nesta fase, **usada só na Fase 2**. Existe agora para que a Fase 2 não
exija migração de dados já em produção.

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `source` | enum | `notification` \| `ofx` \| `csv` |
| `raw_input` | text | |
| `status` | enum | `pending` \| `confirmed` \| `discarded` |

## A regra do regime de caixa por parcela

Decisão central do app, aprovada explicitamente.

Uma compra de R$ 3.000 em 10x feita em 5 de agosto **não** conta como R$ 3.000
de despesa em agosto. Conta como R$ 300 em cada um dos 10 meses das faturas
correspondentes.

Motivo: é assim que a pessoa sente o dinheiro sair, e é o que faz a barra de
orçamento de uma categoria refletir o que realmente cabe no mês.

Para que o compromisso total não fique invisível, o dashboard exibe um cartão
**"Comprometido com parcelas futuras"** somando todas as parcelas com data
posterior ao mês corrente.

## Módulos de cálculo

Funções puras, sem React e sem conhecimento do Supabase. São a fundação
testável do app. Nenhum componente de interface duplica esta lógica.

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| `lib/money.ts` | conversão centavos ↔ `R$ 1.234,56`, soma, arredondamento | — |
| `lib/billing-cycle.ts` | dada data de compra + `closing_day`, retorna a fatura de destino | — |
| `lib/installments.ts` | dado total, nº de parcelas e data, gera as parcelas datadas | money, billing-cycle |
| `lib/simulator.ts` | à vista × parcelado: rendimento, juros embutidos, veredito | money, billing-cycle |
| `lib/insights.ts` | dadas transações + orçamentos + dia do mês, gera as frases de alerta | money |
| `lib/forecast.ts` | saldo previsto do fim do mês | money |

### `lib/forecast.ts` — definição de Saldo Previsto

`Saldo Previsto = Saldo Atual + receitas recorrentes ainda não lançadas neste
mês − despesas recorrentes ainda não lançadas neste mês − parcelas com
vencimento ainda dentro deste mês.`

"Receita/despesa recorrente ainda não lançada" significa: existe uma transação
com `is_recurring = true` na mesma categoria e mesmo valor no mês anterior, e
não existe equivalente neste mês. É uma projeção, e a interface diz isso ao
lado do número.

### `lib/installments.ts` — regra do arredondamento

R$ 100,00 em 3x não divide exato. A regra: cada parcela recebe
`floor(total / n)` centavos, e o resto vai **na primeira parcela**. R$ 100,00
em 3x = R$ 33,34 + R$ 33,33 + R$ 33,33. A soma das parcelas é sempre igual ao
total, sem exceção.

### `lib/billing-cycle.ts` — regra da fatura

Compra **antes** do dia de fechamento entra na fatura que fecha naquele mês.
Compra **no dia do fechamento ou depois** entra na fatura seguinte.

### `lib/simulator.ts` — comparação à vista × parcelado

Entradas: preço à vista, nº de parcelas, valor da parcela, taxa mensal de
rendimento, e opcionalmente o ciclo do cartão (pré-preenchido a partir dos
cartões cadastrados do usuário).

Compara dois fluxos de caixa:
- **À vista**: saída integral hoje, sem rendimento
- **Parcelado**: o dinheiro fica aplicado e é sacado mês a mês para pagar cada
  parcela; a carência do ciclo do cartão adia a primeira saída

Saídas: diferença total, rendimento acumulado no período, taxa de juros
implícita no parcelamento (ao mês e ao ano), e um veredito em português claro.

## Telas

Barra lateral no desktop, barra inferior no celular.

### `/login`
E-mail + senha e botão "Entrar com Google". Tela única.

### `/` — Dashboard
- Quatro cartões: Receitas, Despesas, Saldo Atual, Saldo Previsto
- Cartão "Comprometido com parcelas futuras"
- Faixa de insights em português claro
  (ex: *"Você já usou 80% do orçamento de 🎬 Lazer e ainda faltam 16 dias para
  o mês fechar."*)
- Gráfico de pizza: despesas por categoria no mês
- Gráfico de linha: saldo acumulado nos últimos 12 meses

Cada número tem um `?` que explica como foi calculado.

### `/transacoes`
Lista com filtros em pílulas (Este mês / Mês passado / Só despesas / Por
categoria) e busca por descrição. Botão flutuante `+` abre formulário em painel
lateral, sem trocar de página. Ao marcar "parcelado", o formulário pede nº de
parcelas e cartão, e mostra uma prévia das parcelas geradas antes de salvar.
Editar e excluir na própria linha.

### `/cartoes`
Um cartão visual por cartão de crédito: fatura atual, fatura seguinte já
formada, limite disponível, datas de fechamento e vencimento. Clicar abre a
fatura detalhada.

### `/orcamentos`
Uma barra de progresso por categoria. Cores, com os limites exatos:
**verde** abaixo de 70%, **amarelo** de 70% (inclusive) até abaixo de 100%,
**vermelho** a partir de 100% (inclusive). Definir o teto é digitar um número
na linha. Botão "copiar do mês anterior".

Categoria sem teto definido não aparece com barra: mostra só o valor gasto,
sem cor. Ausência de orçamento não é o mesmo que orçamento zero.

### `/simulador`
Comparador à vista × parcelado. Ciclo do cartão pré-preenchido a partir dos
cartões cadastrados. Botão "lançar essa compra" leva os dados para o formulário
de transação.

### `/categorias`
Gerenciar categorias. As 32 já vêm semeadas.

### Direção visual
Claro por padrão, com modo escuro. Números grandes e legíveis, bastante espaço
em branco. Nenhum jargão financeiro sem explicação ao lado.

## Tratamento de erros

| Categoria | Tratamento |
|---|---|
| Erro de digitação (valor negativo, data absurda, parcela sem cartão) | Validação Zod no formulário, mensagem em português imediata |
| Erro de rede ou banco | A tela não quebra: exibe o que já tem e um aviso discreto "não consegui atualizar agora" |
| Erro inesperado | `error.tsx` do Next com mensagem e botão de recarregar. Nunca tela branca |

## Testes

Os seis módulos de cálculo são escritos com testes **antes** da implementação
(Vitest). Casos obrigatórios já identificados:

- Compra no dia exato do fechamento da fatura
- Compra um dia antes e um dia depois do fechamento
- R$ 100,00 em 3x (arredondamento; soma das parcelas = total)
- Fevereiro, e ano bissexto
- Cartão com `closing_day = 31` em meses de 30 dias e em fevereiro
- Parcelamento que atravessa a virada de ano
- Orçamento em 0%, 69%, 70%, 99%, 100% e acima de 100% (limites de cor)
- Simulador com taxa de rendimento zero
- Insights quando não há nenhuma transação no mês

## Segurança

- RLS ativa em todas as tabelas, política `auth.uid() = user_id`
- A chave `service_role` nunca aparece no código do cliente
- **O isolamento é verificado antes da entrega**: dois usuários de teste são
  criados e se comprova, com requisições diretas à API usando o token de cada
  um, que nenhum enxerga ou altera os dados do outro. A interface não é aceita
  como prova

## Publicação

Vercel, com as variáveis de ambiente do Supabase. A publicação só acontece após
confirmação explícita do usuário.

## Fases seguintes

- **Fase 2** — leitor inteligente de notificações bancárias (LLM extraindo
  valor, data, estabelecimento, categoria provável e tipo) e importação
  OFX/CSV, usando a tabela `import_batches`
- **Fase 3** — metas de poupança, controle de dívidas (Avalanche e Bola de
  Neve), carteira de investimentos, patrimônio e cálculo FIRE
