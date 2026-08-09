# Suas finanças

Aplicativo web de finanças pessoais em português, feito para substituir a
planilha `Planilha_Clareza_Financeira_2026`.

## O que ele faz

- **Resumo** — receitas, despesas, saldo atual e saldo previsto do mês, com
  avisos em português claro ("Você já usou 80% do orçamento de 🎬 Lazer e ainda
  faltam 16 dias para o mês fechar")
- **Lançamentos** — receitas e despesas com filtros por mês, tipo, categoria e
  busca por descrição
- **Cartões** — fatura atual e a seguinte de cada cartão, com o ciclo de
  fechamento e vencimento
- **Orçamentos** — teto por categoria, com barra verde, amarela ou vermelha
- **Simulador** — compara pagar à vista com parcelar deixando o dinheiro
  rendendo, e mostra os juros escondidos no parcelamento
- **Categorias** — as 32 categorias da planilha antiga já vêm cadastradas

## A regra mais importante: como as parcelas contam

Esta é a decisão que mais gera dúvida ao olhar os números, então vale ler.

Você compra uma TV de **R$ 3.000 em 10x** no dia 5 de agosto. Quanto o app diz
que você gastou em agosto?

**R$ 300.** Não R$ 3.000.

Cada parcela conta no mês em que ela **vence**, não no mês da compra. O motivo
é que é assim que o dinheiro sai da sua conta — e é isso que faz o orçamento de
uma categoria refletir o que realmente cabe no seu mês.

Para o compromisso total não ficar invisível, o Resumo mostra uma faixa
**"Comprometido com parcelas futuras"** com a soma das parcelas que vencem
depois deste mês — no exemplo, R$ 2.700.

O app também respeita o ciclo do seu cartão: uma compra feita **depois** do dia
de fechamento cai só na fatura seguinte. Comprar dia 5 num cartão que fecha dia
20 e vence 27 dá 22 dias até a primeira parcela; comprar dia 21 dá 37 dias.

## Como rodar na sua máquina

Você precisa do Node.js instalado (versão 24 ou mais nova).

```bash
npm install
```

Copie o arquivo de exemplo e preencha com os dados do seu projeto Supabase
(Project Settings → API):

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

O app abre em `http://localhost:3000`.

O `.env.local` **nunca** vai para o git — é onde ficam as chaves.

## O banco de dados

As migrações ficam em `supabase/migrations/`, numeradas na ordem em que devem
ser aplicadas. Elas criam as tabelas, ligam a proteção por usuário e cadastram
as 32 categorias iniciais quando alguém cria uma conta.

`scripts/prova-rls.md` registra os testes feitos **por fora do app**, batendo
direto na API com o token de dois usuários diferentes, para provar que um não
enxerga nem altera os dados do outro. A interface não é prova de segurança.

## Testes

```bash
npm test
```

São 202 testes em duas frentes:

- **lógica** — os módulos de cálculo (dinheiro, ciclo de fatura, parcelas,
  simulador, previsão de saldo, avisos), sem interface nenhuma
- **componentes** — as telas com DOM de verdade, simulando cliques

Os cálculos foram escritos com os testes **antes** do código. É onde mora o
risco: um erro de arredondamento ou de ciclo de fatura produz um número errado
que só apareceria meses depois.

Vale rodar também:

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

## Publicar na internet

O app é publicado na Vercel. Os dados continuam protegidos por login: sem
sessão, toda tela redireciona para `/login`, e o banco recusa qualquer leitura
sem token — as duas coisas foram verificadas.

**1. Entre na Vercel** (só na primeira vez):

```bash
npx vercel login
```

**2. Publique:**

```bash
npx vercel --prod
```

**3. Configure as variáveis de ambiente** no painel da Vercel, em
Settings → Environment Variables. São as mesmas duas do seu `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Depois de adicioná-las, publique de novo para elas valerem.

**4. Libere a URL no Supabase**, em Authentication → URL Configuration:

- **Site URL**: a URL que a Vercel devolveu
- **Redirect URLs**: adicione também `SUA-URL/auth/callback`

Sem isso o login não volta para o lugar certo.

## Configurações recomendadas no Supabase

Ficam no painel do projeto e não dá para mudar pelo código:

- **Authentication → Attack Protection → Leaked password protection**: liga a
  checagem contra o banco do HaveIBeenPwned, que recusa senhas já vazadas em
  ataques conhecidos. O verificador de segurança do Supabase aponta isso
  enquanto estiver desligado.
- **Authentication → Providers → Google**: para o botão "Entrar com Google"
  aparecer. A rota `/auth/callback` já está pronta; falta só o Client ID e o
  Client Secret do Google Cloud. Enquanto não houver, o botão fica escondido
  em vez de dar erro.

## O que ainda não existe

Ficou fora desta primeira versão, de propósito:

- Leitor de notificações bancárias (colar o texto do aviso do banco e o app
  entender sozinho) e importação de arquivos OFX/CSV
- Metas de poupança
- Controle de dívidas com os métodos Bola de Neve e Avalanche
- Carteira de investimentos, patrimônio e cálculo de independência financeira
- Exportar relatórios em PDF
- Lançamentos recorrentes automáticos — o campo "repete todo mês" existe e
  entra no saldo previsto, mas nada é lançado sozinho
