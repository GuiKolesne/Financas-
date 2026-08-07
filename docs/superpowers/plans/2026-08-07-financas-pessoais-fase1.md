# App de Finanças Pessoais — Fase 1 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o núcleo de um app web de finanças pessoais em português — transações, cartões de crédito com parcelamento, orçamentos por categoria, dashboard didático e simulador de compra à vista × parcelada — substituindo a planilha `Planilha_Clareza_Financeira_2026`.

**Architecture:** Next.js 15 App Router. Server Components leem o Postgres do Supabase usando o cookie de sessão; Row Level Security no banco garante que cada usuário só enxerga os próprios dados. Toda a matemática financeira vive em seis módulos puros em `src/lib/`, sem React e sem conhecimento do Supabase, escritos com testes antes da implementação. A interface nunca duplica esses cálculos.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth + RLS), Recharts, Zod, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-07-financas-pessoais-fase1-design.md`

## Global Constraints

Estas regras valem para **todas** as tarefas. Os requisitos de cada tarefa incluem implicitamente esta seção.

- **Idioma:** toda a interface, mensagens de erro e comentários de código voltados ao usuário em **português do Brasil**. Sem jargão financeiro sem explicação ao lado.
- **Dinheiro:** valores monetários são **sempre inteiros em centavos** (`amount_cents integer`). Nunca `float`, nunca `numeric` para dinheiro. A conversão para `R$ 1.234,56` acontece só na exibição, via `lib/money.ts`.
- **Cálculo:** nenhum componente de interface implementa matemática financeira. Se um número precisa ser calculado, a função vive em `src/lib/` e tem teste.
- **Segurança:** RLS ativa em todas as tabelas, política `auth.uid() = user_id` para SELECT, INSERT, UPDATE e DELETE. A chave `service_role` nunca entra em código versionado nem em variável `NEXT_PUBLIC_*`.
- **Sem valores inventados:** URLs de projeto Supabase, chaves e IDs reais vêm do ambiente ou são obtidos via ferramenta. Nunca escrever um valor placeholder que pareça real.
- **Datas:** o app opera em `America/Sao_Paulo`. Colunas de data são `date` (sem hora) para evitar deslocamento de fuso.
- **Node:** v24.18.1, npm 11.16.0 (verificados no ambiente).
- **Commits:** um commit ao final de cada tarefa, mensagem em português, sem `--no-verify`.

## Estrutura de Arquivos

```
financas-pessoais/
├── package.json  tsconfig.json  next.config.ts  vitest.config.ts
├── .env.example                     (versionado, sem segredos)
├── .env.local                       (NÃO versionado)
├── supabase/migrations/
│   ├── 0001_schema.sql              tabelas, enums, índices
│   ├── 0002_rls.sql                 políticas RLS
│   └── 0003_seed_categories.sql     trigger de cadastro + 32 categorias
├── src/
│   ├── lib/
│   │   ├── types.ts                 tipos de domínio compartilhados
│   │   ├── money.ts                 centavos ↔ texto pt-BR
│   │   ├── billing-cycle.ts         data de compra → fatura de destino
│   │   ├── installments.ts          divisão e datação de parcelas
│   │   ├── simulator.ts             à vista × parcelado
│   │   ├── insights.ts              frases de alerta do dashboard
│   │   ├── forecast.ts              saldo previsto do fim do mês
│   │   └── supabase/
│   │       ├── server.ts            client para Server Components/Actions
│   │       ├── client.ts            client para Client Components
│   │       └── middleware.ts        renovação de sessão
│   ├── middleware.ts                gate de autenticação
│   ├── queries/                     acesso a dados, um arquivo por domínio
│   │   ├── categories.ts  cards.ts  transactions.ts  budgets.ts  dashboard.ts
│   ├── app/
│   │   ├── layout.tsx  globals.css  error.tsx
│   │   ├── login/page.tsx  login/actions.ts
│   │   ├── auth/callback/route.ts
│   │   └── (app)/
│   │       ├── layout.tsx           casca com navegação
│   │       ├── page.tsx             dashboard
│   │       ├── transacoes/page.tsx  transacoes/actions.ts
│   │       ├── cartoes/page.tsx     cartoes/actions.ts  cartoes/[id]/page.tsx
│   │       ├── orcamentos/page.tsx  orcamentos/actions.ts
│   │       ├── simulador/page.tsx
│   │       └── categorias/page.tsx  categorias/actions.ts
│   └── components/
│       ├── ui/                      Button, Input, MoneyInput, Sheet, ProgressBar
│       ├── nav.tsx
│       ├── dashboard/               SummaryCards, InsightsBar, CategoryPie, BalanceLine
│       ├── transactions/            TransactionList, TransactionForm, Filters
│       ├── cards/                   CreditCardTile, InvoiceDetail
│       ├── budgets/                 BudgetRow
│       └── simulator/               SimulatorForm, SimulatorResult
```

Testes ficam ao lado do código: `src/lib/money.test.ts`.

**Ordem de construção:** os módulos puros (Tarefas 2–8) vêm antes de qualquer interface. São a fundação testável; um erro ali produz um número errado que só apareceria meses depois.

---

### Task 1: Esqueleto do projeto

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Test: `src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: projeto Next.js 15 rodando em `npm run dev`; `npm test` executando Vitest

- [ ] **Step 1: Criar o projeto Next.js**

Rodar na pasta `C:\Users\guiko\OneDrive\Desktop\CLAUDE\financas-pessoais` (que já existe e já é um repositório git com a spec commitada):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Se o comando reclamar que o diretório não está vazio, aceitar prosseguir — os arquivos `docs/` e `.git/` devem ser preservados.

- [ ] **Step 2: Instalar as dependências restantes**

```bash
npm install @supabase/supabase-js @supabase/ssr recharts zod
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: Configurar o Vitest**

Criar `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Adicionar o script em `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Escrever o teste de fumaça**

Criar `src/lib/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('ambiente de testes', () => {
  it('executa e compara valores', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Rodar o teste**

Run: `npm test`
Expected: PASS — 1 teste, 1 arquivo.

- [ ] **Step 6: Criar o `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Confirmar que `.gitignore` contém `.env*.local` (o `create-next-app` já inclui). Se não contiver, adicionar.

- [ ] **Step 7: Verificar que o app sobe**

Run: `npm run dev` e abrir `http://localhost:3000`
Expected: página inicial padrão do Next.js, sem erro no terminal. Encerrar com Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: esqueleto Next.js 15 com Tailwind e Vitest"
```

---

### Task 2: `lib/types.ts` — tipos de domínio

**Files:**
- Create: `src/lib/types.ts`

**Interfaces:**
- Consumes: nada
- Produces: os tipos usados por todos os módulos e queries seguintes:
  `TransactionType`, `PaymentMethod`, `Category`, `CreditCard`, `Transaction`, `Budget`, `BudgetStatus`

Esta tarefa não tem teste próprio — são apenas declarações de tipo, verificadas pelo compilador. Ela existe separada porque todas as tarefas seguintes dependem destes nomes exatos.

- [ ] **Step 1: Escrever os tipos**

Criar `src/lib/types.ts`:

```ts
/** Um lançamento é receita ou despesa. O valor em si é sempre positivo. */
export type TransactionType = 'income' | 'expense';

/** Como o pagamento foi feito. Só 'credit' envolve fatura e parcelamento. */
export type PaymentMethod = 'pix' | 'debit' | 'cash' | 'credit';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: TransactionType;
  isArchived: boolean;
}

export interface CreditCard {
  id: string;
  nickname: string;
  brand: string;
  limitCents: number;
  /** Dia do mês em que a fatura fecha (1–31). */
  closingDay: number;
  /** Dia do mês em que a fatura vence (1–31). */
  dueDay: number;
  color: string;
}

export interface Transaction {
  id: string;
  /** Data de competência: para parcelas, o vencimento da fatura. */
  date: string; // ISO 'YYYY-MM-DD'
  amountCents: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  creditCardId: string | null;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  isRecurring: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  /** Primeiro dia do mês do orçamento, ISO 'YYYY-MM-01'. */
  month: string;
  limitCents: number;
}

/** Uma categoria com seu teto e o quanto já foi gasto no mês. */
export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  /** null quando não há teto definido — diferente de teto zero. */
  limitCents: number | null;
  spentCents: number;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: tipos de dominio compartilhados"
```

---

### Task 3: `lib/money.ts` — dinheiro em centavos

**Files:**
- Create: `src/lib/money.ts`
- Test: `src/lib/money.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `formatBRL(cents: number): string` — `123456` → `"R$ 1.234,56"`
  - `formatBRLCompact(cents: number): string` — `123456` → `"1.234,56"` (sem prefixo, para inputs)
  - `parseBRL(input: string): number` — `"1.234,56"` → `123456`
  - `toCents(reais: number): number` — `1234.56` → `123456`
  - `sumCents(values: number[]): number`

**Contrato do `parseBRL`:** aceita apenas o formato brasileiro. Todo caractere que não seja dígito ou vírgula é descartado; a vírgula é o separador decimal. `"R$ 1.234,56"` → `123456`. `"1234"` → `123400`. Entrada sem dígito nenhum → `0`. Esse contrato é possível porque o único produtor dessas strings é o `MoneyInput` (Tarefa 15), que sempre emite formato brasileiro.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/money.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatBRL, formatBRLCompact, parseBRL, toCents, sumCents } from './money';

describe('formatBRL', () => {
  it('formata milhares com ponto e centavos com virgula', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
  });

  it('formata valor abaixo de um real', () => {
    expect(formatBRL(5)).toBe('R$ 0,05');
  });

  it('formata zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('formata valor negativo com o sinal antes do simbolo', () => {
    expect(formatBRL(-123456)).toBe('-R$ 1.234,56');
  });

  it('formata milhoes', () => {
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89');
  });
});

describe('formatBRLCompact', () => {
  it('omite o prefixo R$', () => {
    expect(formatBRLCompact(123456)).toBe('1.234,56');
  });
});

describe('parseBRL', () => {
  it('interpreta o formato brasileiro completo', () => {
    expect(parseBRL('R$ 1.234,56')).toBe(123456);
  });

  it('interpreta sem simbolo de moeda', () => {
    expect(parseBRL('1.234,56')).toBe(123456);
  });

  it('interpreta valor inteiro sem centavos', () => {
    expect(parseBRL('1234')).toBe(123400);
  });

  it('interpreta um unico digito de centavos como decimo', () => {
    expect(parseBRL('10,5')).toBe(1050);
  });

  it('devolve zero para entrada vazia', () => {
    expect(parseBRL('')).toBe(0);
  });

  it('devolve zero para entrada sem digitos', () => {
    expect(parseBRL('abc')).toBe(0);
  });

  it('ignora digitos alem do segundo decimal', () => {
    expect(parseBRL('10,567')).toBe(1056);
  });
});

describe('toCents', () => {
  it('converte reais para centavos arredondando', () => {
    expect(toCents(1234.56)).toBe(123456);
  });

  it('nao sofre com erro de ponto flutuante', () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe('sumCents', () => {
  it('soma uma lista de centavos', () => {
    expect(sumCents([100, 200, 350])).toBe(650);
  });

  it('soma lista vazia como zero', () => {
    expect(sumCents([])).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/money.test.ts`
Expected: FAIL — `Failed to resolve import "./money"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/money.ts`:

```ts
/**
 * Dinheiro no app é sempre um inteiro de centavos. Este módulo é a única
 * fronteira entre esse inteiro e o texto que a pessoa lê ou digita.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 → "R$ 1.234,56". Negativo vira "-R$ 1.234,56". */
export function formatBRL(cents: number): string {
  const sinal = cents < 0 ? '-' : '';
  return `${sinal}R$ ${BRL.format(Math.abs(cents) / 100)}`;
}

/** Mesmo que formatBRL, sem o prefixo — para dentro de campos de digitação. */
export function formatBRLCompact(cents: number): string {
  const sinal = cents < 0 ? '-' : '';
  return `${sinal}${BRL.format(Math.abs(cents) / 100)}`;
}

/**
 * Lê o formato brasileiro e devolve centavos.
 * Descarta tudo que não for dígito ou vírgula; a vírgula é o decimal.
 */
export function parseBRL(input: string): number {
  const limpo = input.replace(/[^\d,]/g, '');
  if (limpo === '') return 0;

  const [inteira, decimal = ''] = limpo.split(',');
  const reais = inteira === '' ? 0 : Number(inteira);
  const centavos = Number(decimal.padEnd(2, '0').slice(0, 2));

  return reais * 100 + centavos;
}

/** 1234.56 → 123456, imune ao erro de ponto flutuante. */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/money.test.ts`
Expected: PASS — 16 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.ts src/lib/money.test.ts
git commit -m "feat: modulo de dinheiro em centavos com formatacao pt-BR"
```

---

### Task 4: `lib/billing-cycle.ts` — em qual fatura a compra cai

**Files:**
- Create: `src/lib/billing-cycle.ts`
- Test: `src/lib/billing-cycle.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `lastDayOfMonth(year: number, month: number): number` — `month` é 1–12
  - `clampDay(year: number, month: number, day: number): number` — dia 31 em fevereiro vira 28/29
  - `addMonths(year: number, month: number, count: number): { year: number; month: number }` — exportada porque a Tarefa 5 precisa dela; sem isso a aritmética de virada de ano ficaria duplicada nos dois módulos
  - `invoiceMonthFor(purchaseDate: string, closingDay: number): { year: number; month: number }`
  - `dueDateFor(invoiceYear: number, invoiceMonth: number, closingDay: number, dueDay: number): string`
  - `firstDueDateFor(purchaseDate: string, closingDay: number, dueDay: number): string`

Todas as datas trafegam como string ISO `'YYYY-MM-DD'`, nunca como `Date`, para não haver deslocamento de fuso.

**Duas regras que este módulo codifica:**

1. **Fatura de destino:** compra **antes** do dia de fechamento entra na fatura que fecha naquele mês. Compra **no dia do fechamento ou depois** entra na fatura seguinte.
2. **Vencimento:** a fatura que fecha no mês M vence no mês M se `dueDay > closingDay`; caso contrário vence no mês M+1.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/billing-cycle.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  lastDayOfMonth,
  clampDay,
  invoiceMonthFor,
  dueDateFor,
  firstDueDateFor,
} from './billing-cycle';

describe('lastDayOfMonth', () => {
  it('conhece meses de 31 dias', () => {
    expect(lastDayOfMonth(2026, 1)).toBe(31);
  });

  it('conhece meses de 30 dias', () => {
    expect(lastDayOfMonth(2026, 4)).toBe(30);
  });

  it('conhece fevereiro em ano comum', () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
  });

  it('conhece fevereiro em ano bissexto', () => {
    expect(lastDayOfMonth(2028, 2)).toBe(29);
  });
});

describe('clampDay', () => {
  it('mantem o dia quando ele existe no mes', () => {
    expect(clampDay(2026, 1, 31)).toBe(31);
  });

  it('encurta o dia 31 para o ultimo dia de fevereiro', () => {
    expect(clampDay(2026, 2, 31)).toBe(28);
  });

  it('encurta o dia 31 para 30 em meses de 30 dias', () => {
    expect(clampDay(2026, 4, 31)).toBe(30);
  });
});

describe('invoiceMonthFor', () => {
  it('compra antes do fechamento entra na fatura do mes', () => {
    expect(invoiceMonthFor('2026-08-05', 20)).toEqual({ year: 2026, month: 8 });
  });

  it('compra no dia exato do fechamento entra na fatura seguinte', () => {
    expect(invoiceMonthFor('2026-08-20', 20)).toEqual({ year: 2026, month: 9 });
  });

  it('compra um dia antes do fechamento entra na fatura do mes', () => {
    expect(invoiceMonthFor('2026-08-19', 20)).toEqual({ year: 2026, month: 8 });
  });

  it('compra um dia depois do fechamento entra na fatura seguinte', () => {
    expect(invoiceMonthFor('2026-08-21', 20)).toEqual({ year: 2026, month: 9 });
  });

  it('vira o ano quando a compra e em dezembro depois do fechamento', () => {
    expect(invoiceMonthFor('2026-12-25', 20)).toEqual({ year: 2027, month: 1 });
  });

  it('cartao que fecha dia 31: compra em 28 de fevereiro cai na fatura seguinte', () => {
    // O fechamento encurta para 28, e a compra no dia 28 já é "no fechamento".
    expect(invoiceMonthFor('2026-02-28', 31)).toEqual({ year: 2026, month: 3 });
  });

  it('cartao que fecha dia 31: compra em 27 de fevereiro cai na fatura do mes', () => {
    expect(invoiceMonthFor('2026-02-27', 31)).toEqual({ year: 2026, month: 2 });
  });
});

describe('dueDateFor', () => {
  it('vence no mesmo mes quando o vencimento e depois do fechamento', () => {
    expect(dueDateFor(2026, 8, 20, 27)).toBe('2026-08-27');
  });

  it('vence no mes seguinte quando o vencimento e antes do fechamento', () => {
    expect(dueDateFor(2026, 8, 20, 10)).toBe('2026-09-10');
  });

  it('vence no mes seguinte quando vencimento e fechamento sao no mesmo dia', () => {
    expect(dueDateFor(2026, 8, 20, 20)).toBe('2026-09-20');
  });

  it('vira o ano quando a fatura de dezembro vence em janeiro', () => {
    expect(dueDateFor(2026, 12, 20, 10)).toBe('2027-01-10');
  });

  it('encurta o dia de vencimento que nao existe no mes', () => {
    expect(dueDateFor(2026, 1, 20, 31)).toBe('2026-01-31');
    expect(dueDateFor(2026, 2, 20, 31)).toBe('2026-02-28');
  });
});

describe('firstDueDateFor', () => {
  it('combina fatura de destino e vencimento', () => {
    // Compra em 05/08 num cartao que fecha 20 e vence 27:
    // entra na fatura de agosto, que vence em 27/08.
    expect(firstDueDateFor('2026-08-05', 20, 27)).toBe('2026-08-27');
  });

  it('compra depois do fechamento adia o primeiro vencimento', () => {
    expect(firstDueDateFor('2026-08-21', 20, 27)).toBe('2026-09-27');
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/billing-cycle.test.ts`
Expected: FAIL — `Failed to resolve import "./billing-cycle"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/billing-cycle.ts`:

```ts
/**
 * Traduz uma data de compra no cartão para a fatura em que ela cai e para a
 * data em que o dinheiro realmente sai da conta.
 *
 * Datas trafegam como string ISO 'YYYY-MM-DD'. Não usamos objetos Date na
 * fronteira do módulo porque `new Date('2026-08-05')` é interpretado em UTC
 * e, no fuso do Brasil, voltaria um dia.
 */

/** Quantos dias tem o mês. `month` é 1–12. */
export function lastDayOfMonth(year: number, month: number): number {
  // Dia 0 do mês seguinte é o último dia deste mês.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Encurta um dia que não existe no mês: 31 em fevereiro vira 28 (ou 29). */
export function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, lastDayOfMonth(year, month));
}

function parseISO(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function toISO(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Soma meses a um par ano/mês, virando o ano quando passa de dezembro. */
export function addMonths(year: number, month: number, count: number) {
  const zeroBased = month - 1 + count;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12) + 1,
  };
}

/**
 * Em qual fatura a compra entra.
 * Antes do fechamento: fatura deste mês. No dia do fechamento ou depois:
 * fatura do mês seguinte.
 */
export function invoiceMonthFor(
  purchaseDate: string,
  closingDay: number,
): { year: number; month: number } {
  const { year, month, day } = parseISO(purchaseDate);
  const fechamento = clampDay(year, month, closingDay);

  return day < fechamento ? { year, month } : addMonths(year, month, 1);
}

/**
 * Quando vence a fatura que fecha em invoiceYear/invoiceMonth.
 * Se o dia de vencimento é depois do fechamento, vence no mesmo mês;
 * senão, no mês seguinte.
 */
export function dueDateFor(
  invoiceYear: number,
  invoiceMonth: number,
  closingDay: number,
  dueDay: number,
): string {
  const alvo =
    dueDay > closingDay
      ? { year: invoiceYear, month: invoiceMonth }
      : addMonths(invoiceYear, invoiceMonth, 1);

  return toISO(alvo.year, alvo.month, clampDay(alvo.year, alvo.month, dueDay));
}

/** Data em que a primeira parcela de uma compra sai da conta. */
export function firstDueDateFor(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): string {
  const fatura = invoiceMonthFor(purchaseDate, closingDay);
  return dueDateFor(fatura.year, fatura.month, closingDay, dueDay);
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/billing-cycle.test.ts`
Expected: PASS — 21 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing-cycle.ts src/lib/billing-cycle.test.ts
git commit -m "feat: ciclo de fatura do cartao com virada de ano e dia encurtado"
```

---

### Task 5: `lib/installments.ts` — divisão e datação das parcelas

**Files:**
- Create: `src/lib/installments.ts`
- Test: `src/lib/installments.test.ts`

**Interfaces:**
- Consumes: `billing-cycle.ts` (`firstDueDateFor`, `dueDateFor`, `invoiceMonthFor`, `clampDay`)
- Produces:
  - `splitAmount(totalCents: number, count: number): number[]`
  - `generateInstallments(input: InstallmentInput): InstallmentSpec[]`
  - `interface InstallmentInput { totalCents; count; purchaseDate; closingDay; dueDay }`
  - `interface InstallmentSpec { number: number; amountCents: number; dueDate: string }`

**Regra do arredondamento:** cada parcela recebe `floor(total / n)` centavos e o resto vai **na primeira**. `R$ 100,00` em 3x = `33,34 + 33,33 + 33,33`. A soma das parcelas é sempre exatamente o total.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/installments.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { splitAmount, generateInstallments } from './installments';
import { sumCents } from './money';

describe('splitAmount', () => {
  it('divide exatamente quando nao ha resto', () => {
    expect(splitAmount(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it('coloca o resto na primeira parcela', () => {
    expect(splitAmount(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it('a soma das parcelas e sempre igual ao total', () => {
    for (const total of [10000, 9999, 100, 1, 123457]) {
      for (const n of [2, 3, 4, 6, 7, 10, 12]) {
        expect(sumCents(splitAmount(total, n))).toBe(total);
      }
    }
  });

  it('trata uma parcela unica', () => {
    expect(splitAmount(9999, 1)).toEqual([9999]);
  });

  it('distribui valor menor que o numero de parcelas', () => {
    expect(splitAmount(2, 3)).toEqual([2, 0, 0]);
  });

  it('rejeita numero de parcelas menor que um', () => {
    expect(() => splitAmount(1000, 0)).toThrow();
  });

  it('rejeita total negativo', () => {
    expect(() => splitAmount(-1000, 3)).toThrow();
  });
});

describe('generateInstallments', () => {
  const cartao = { closingDay: 20, dueDay: 27 };

  it('gera a quantidade certa de parcelas numeradas a partir de 1', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 10,
      purchaseDate: '2026-08-05',
      ...cartao,
    });

    expect(parcelas).toHaveLength(10);
    expect(parcelas[0].number).toBe(1);
    expect(parcelas[9].number).toBe(10);
  });

  it('a primeira parcela vence na fatura correta', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 10,
      purchaseDate: '2026-08-05',
      ...cartao,
    });

    expect(parcelas[0].dueDate).toBe('2026-08-27');
    expect(parcelas[1].dueDate).toBe('2026-09-27');
  });

  it('compra depois do fechamento adia todas as parcelas em um mes', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 3,
      purchaseDate: '2026-08-21',
      ...cartao,
    });

    expect(parcelas.map((p) => p.dueDate)).toEqual([
      '2026-09-27',
      '2026-10-27',
      '2026-11-27',
    ]);
  });

  it('atravessa a virada de ano', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 4,
      purchaseDate: '2026-11-05',
      ...cartao,
    });

    expect(parcelas.map((p) => p.dueDate)).toEqual([
      '2026-11-27',
      '2026-12-27',
      '2027-01-27',
      '2027-02-27',
    ]);
  });

  it('encurta o dia de vencimento nos meses que nao tem aquele dia', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 3,
      purchaseDate: '2026-01-05',
      closingDay: 20,
      dueDay: 31,
    });

    expect(parcelas.map((p) => p.dueDate)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
  });

  it('a soma das parcelas geradas e igual ao total', () => {
    const parcelas = generateInstallments({
      totalCents: 10000,
      count: 3,
      purchaseDate: '2026-08-05',
      ...cartao,
    });

    expect(sumCents(parcelas.map((p) => p.amountCents))).toBe(10000);
    expect(parcelas[0].amountCents).toBe(3334);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/installments.test.ts`
Expected: FAIL — `Failed to resolve import "./installments"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/installments.ts`:

```ts
import { invoiceMonthFor, dueDateFor, addMonths } from './billing-cycle';

export interface InstallmentInput {
  totalCents: number;
  count: number;
  /** ISO 'YYYY-MM-DD' */
  purchaseDate: string;
  closingDay: number;
  dueDay: number;
}

export interface InstallmentSpec {
  /** 1..count */
  number: number;
  amountCents: number;
  /** ISO 'YYYY-MM-DD' — quando o dinheiro sai da conta. */
  dueDate: string;
}

/**
 * Divide um total em N parcelas inteiras de centavos.
 * O resto da divisão vai na primeira parcela, então a soma bate sempre.
 */
export function splitAmount(totalCents: number, count: number): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('O número de parcelas precisa ser um inteiro maior que zero.');
  }
  if (totalCents < 0) {
    throw new Error('O valor total não pode ser negativo.');
  }

  const base = Math.floor(totalCents / count);
  const resto = totalCents - base * count;

  return Array.from({ length: count }, (_, i) => (i === 0 ? base + resto : base));
}

/**
 * Transforma uma compra parcelada nas parcelas concretas, já datadas na
 * fatura em que cada uma cai.
 */
export function generateInstallments(input: InstallmentInput): InstallmentSpec[] {
  const { totalCents, count, purchaseDate, closingDay, dueDay } = input;

  const valores = splitAmount(totalCents, count);
  const primeiraFatura = invoiceMonthFor(purchaseDate, closingDay);

  return valores.map((amountCents, i) => {
    // A parcela k cai na fatura k-1 meses depois da primeira.
    const fatura = addMonths(primeiraFatura.year, primeiraFatura.month, i);

    return {
      number: i + 1,
      amountCents,
      dueDate: dueDateFor(fatura.year, fatura.month, closingDay, dueDay),
    };
  });
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/installments.test.ts`
Expected: PASS — 13 testes.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — todos os arquivos, nenhuma regressão.

- [ ] **Step 6: Commit**

```bash
git add src/lib/installments.ts src/lib/installments.test.ts
git commit -m "feat: geracao de parcelas com arredondamento e datas de fatura"
```

---

### Task 6: `lib/simulator.ts` — à vista × parcelado

**Files:**
- Create: `src/lib/simulator.ts`
- Test: `src/lib/simulator.test.ts`

**Interfaces:**
- Consumes: `money.ts` (`formatBRL`)
- Produces:
  - `interface SimulatorInput { cashPriceCents; installmentsCount; installmentAmountCents; monthlyRatePercent; graceMonths }`
  - `interface SimulatorResult { cashTotalCents; installmentTotalCents; differenceCents; investmentGainCents; finalBalanceCents; implicitMonthlyRatePercent; implicitAnnualRatePercent; betterOption; verdict }`
  - `simulate(input: SimulatorInput): SimulatorResult`

**O modelo mental:** você tem o preço à vista em mãos hoje. Ou paga tudo agora e fica com zero, ou aplica o dinheiro e vai sacando para pagar cada parcela. `finalBalanceCents` é o que sobra no segundo caminho. Positivo significa que parcelar deixou você com dinheiro a mais; negativo, que sair à vista foi melhor.

`graceMonths` é a carência: quantos meses o dinheiro rende antes da primeira parcela sair. Vem do ciclo do cartão — comprar logo depois do fechamento dá quase dois meses. Valor mínimo 1.

**Juros embutidos:** a taxa `i` que faz o valor presente das parcelas igualar o preço à vista. Resolvida por bisseção. Quando o total parcelado não passa do preço à vista, a taxa é zero (não existe juros embutido).

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/simulator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { simulate } from './simulator';

const base = {
  cashPriceCents: 100000,
  installmentsCount: 10,
  installmentAmountCents: 10000,
  monthlyRatePercent: 0,
  graceMonths: 1,
};

describe('simulate — totais', () => {
  it('soma o total parcelado', () => {
    expect(simulate(base).installmentTotalCents).toBe(100000);
  });

  it('calcula a diferenca entre parcelado e a vista', () => {
    const r = simulate({ ...base, installmentAmountCents: 11000 });
    expect(r.installmentTotalCents).toBe(110000);
    expect(r.differenceCents).toBe(10000);
  });
});

describe('simulate — sem rendimento', () => {
  it('parcelado sem juros e sem rendimento empata com a vista', () => {
    const r = simulate(base);
    expect(r.finalBalanceCents).toBe(0);
    expect(r.betterOption).toBe('tie');
  });

  it('parcelado mais caro sem rendimento perde para a vista', () => {
    const r = simulate({ ...base, installmentAmountCents: 11000 });
    expect(r.finalBalanceCents).toBe(-10000);
    expect(r.betterOption).toBe('cash');
  });

  it('nao ha ganho de investimento quando a taxa e zero', () => {
    expect(simulate(base).investmentGainCents).toBe(0);
  });
});

describe('simulate — com rendimento', () => {
  it('parcelado sem juros com dinheiro rendendo ganha da a vista', () => {
    const r = simulate({ ...base, monthlyRatePercent: 0.9 });
    expect(r.finalBalanceCents).toBeGreaterThan(0);
    expect(r.betterOption).toBe('installments');
  });

  it('rendimento maior produz saldo final maior', () => {
    const baixo = simulate({ ...base, monthlyRatePercent: 0.5 });
    const alto = simulate({ ...base, monthlyRatePercent: 1.5 });
    expect(alto.finalBalanceCents).toBeGreaterThan(baixo.finalBalanceCents);
  });

  it('carencia maior produz saldo final maior', () => {
    const curta = simulate({ ...base, monthlyRatePercent: 0.9, graceMonths: 1 });
    const longa = simulate({ ...base, monthlyRatePercent: 0.9, graceMonths: 2 });
    expect(longa.finalBalanceCents).toBeGreaterThan(curta.finalBalanceCents);
  });

  it('o ganho de investimento e positivo quando ha taxa', () => {
    expect(simulate({ ...base, monthlyRatePercent: 0.9 }).investmentGainCents)
      .toBeGreaterThan(0);
  });
});

describe('simulate — juros embutidos', () => {
  it('nao ha juros embutido quando o total parcelado iguala o a vista', () => {
    expect(simulate(base).implicitMonthlyRatePercent).toBe(0);
  });

  it('nao ha juros embutido quando o parcelado e mais barato', () => {
    const r = simulate({ ...base, installmentAmountCents: 9000 });
    expect(r.implicitMonthlyRatePercent).toBe(0);
  });

  it('uma parcela de 110 sobre 100 a vista da exatamente 10% ao mes', () => {
    const r = simulate({
      cashPriceCents: 100000,
      installmentsCount: 1,
      installmentAmountCents: 110000,
      monthlyRatePercent: 0,
      graceMonths: 1,
    });
    expect(r.implicitMonthlyRatePercent).toBeCloseTo(10, 2);
  });

  it('converte a taxa mensal para anual com juros compostos', () => {
    const r = simulate({
      cashPriceCents: 100000,
      installmentsCount: 1,
      installmentAmountCents: 110000,
      monthlyRatePercent: 0,
      graceMonths: 1,
    });
    // (1,10)^12 - 1 = 213,84%
    expect(r.implicitAnnualRatePercent).toBeCloseTo(213.84, 1);
  });

  it('detecta juros embutido em parcelamento longo mais caro', () => {
    const r = simulate({ ...base, installmentsCount: 12, installmentAmountCents: 10000 });
    expect(r.implicitMonthlyRatePercent).toBeGreaterThan(2);
    expect(r.implicitMonthlyRatePercent).toBeLessThan(4);
  });
});

describe('simulate — veredito', () => {
  it('explica em portugues quando parcelar e melhor', () => {
    const r = simulate({ ...base, monthlyRatePercent: 0.9 });
    expect(r.verdict).toContain('Parcelar');
    expect(r.verdict).toContain('R$');
  });

  it('explica em portugues quando a vista e melhor', () => {
    const r = simulate({ ...base, installmentAmountCents: 11000 });
    expect(r.verdict).toContain('à vista');
  });

  it('explica o empate', () => {
    expect(simulate(base).verdict).toContain('mesmo');
  });
});

describe('simulate — validacao', () => {
  it('rejeita numero de parcelas menor que um', () => {
    expect(() => simulate({ ...base, installmentsCount: 0 })).toThrow();
  });

  it('rejeita carencia menor que um', () => {
    expect(() => simulate({ ...base, graceMonths: 0 })).toThrow();
  });

  it('rejeita preco a vista negativo', () => {
    expect(() => simulate({ ...base, cashPriceCents: -1 })).toThrow();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/simulator.test.ts`
Expected: FAIL — `Failed to resolve import "./simulator"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/simulator.ts`:

```ts
import { formatBRL } from './money';

export interface SimulatorInput {
  /** Preço à vista, no PIX ou débito. */
  cashPriceCents: number;
  installmentsCount: number;
  installmentAmountCents: number;
  /** Rendimento mensal da aplicação, em porcentagem. 0,9 significa 0,9% a.m. */
  monthlyRatePercent: number;
  /** Meses até a primeira parcela sair da conta. Mínimo 1. */
  graceMonths: number;
}

export interface SimulatorResult {
  cashTotalCents: number;
  installmentTotalCents: number;
  /** Quanto o parcelado custa a mais em reais nominais. */
  differenceCents: number;
  /** Quanto a aplicação rendeu durante o período. */
  investmentGainCents: number;
  /** O que sobra ao fim se você parcelar e aplicar. Positivo = parcelar ganhou. */
  finalBalanceCents: number;
  implicitMonthlyRatePercent: number;
  implicitAnnualRatePercent: number;
  betterOption: 'cash' | 'installments' | 'tie';
  verdict: string;
}

/** Valor presente das parcelas a uma taxa mensal `i`, considerando a carência. */
function presentValue(
  installmentCents: number,
  count: number,
  graceMonths: number,
  i: number,
): number {
  let total = 0;
  for (let k = 0; k < count; k++) {
    total += installmentCents / Math.pow(1 + i, graceMonths + k);
  }
  return total;
}

/**
 * Acha, por bisseção, a taxa mensal que faz o valor presente das parcelas
 * igualar o preço à vista. É o juro que está escondido no parcelamento.
 */
function implicitMonthlyRate(input: SimulatorInput): number {
  const { cashPriceCents, installmentsCount, installmentAmountCents, graceMonths } = input;

  const total = installmentAmountCents * installmentsCount;
  // Parcelado que não custa mais que o à vista não tem juros embutido.
  if (total <= cashPriceCents || cashPriceCents === 0) return 0;

  let baixo = 0;
  let alto = 1; // 100% ao mês é teto de sobra para qualquer parcelamento real

  for (let iteracao = 0; iteracao < 200; iteracao++) {
    const meio = (baixo + alto) / 2;
    const pv = presentValue(installmentAmountCents, installmentsCount, graceMonths, meio);
    // O valor presente cai conforme a taxa sobe.
    if (pv > cashPriceCents) baixo = meio;
    else alto = meio;
  }

  return (baixo + alto) / 2;
}

/** Compara pagar à vista com parcelar mantendo o dinheiro aplicado. */
export function simulate(input: SimulatorInput): SimulatorResult {
  const {
    cashPriceCents,
    installmentsCount,
    installmentAmountCents,
    monthlyRatePercent,
    graceMonths,
  } = input;

  if (!Number.isInteger(installmentsCount) || installmentsCount < 1) {
    throw new Error('O número de parcelas precisa ser um inteiro maior que zero.');
  }
  if (!Number.isInteger(graceMonths) || graceMonths < 1) {
    throw new Error('A carência precisa ser de pelo menos um mês.');
  }
  if (cashPriceCents < 0 || installmentAmountCents < 0) {
    throw new Error('Valores não podem ser negativos.');
  }

  const taxa = monthlyRatePercent / 100;
  const installmentTotalCents = installmentAmountCents * installmentsCount;

  // Simula o dinheiro aplicado sendo consumido parcela a parcela.
  let saldo = cashPriceCents;
  for (let k = 1; k <= installmentsCount; k++) {
    const mesesRendendo = k === 1 ? graceMonths : 1;
    saldo *= Math.pow(1 + taxa, mesesRendendo);
    saldo -= installmentAmountCents;
  }
  const finalBalanceCents = Math.round(saldo);

  // Sem aplicar, você terminaria com (à vista − total parcelado).
  const semAplicar = cashPriceCents - installmentTotalCents;
  const investmentGainCents = finalBalanceCents - semAplicar;

  const mensal = implicitMonthlyRate(input);
  const implicitMonthlyRatePercent = mensal * 100;
  const implicitAnnualRatePercent = (Math.pow(1 + mensal, 12) - 1) * 100;

  const betterOption: SimulatorResult['betterOption'] =
    finalBalanceCents > 0 ? 'installments' : finalBalanceCents < 0 ? 'cash' : 'tie';

  const verdict =
    betterOption === 'installments'
      ? `Parcelar é melhor: sobram ${formatBRL(finalBalanceCents)} se você aplicar o dinheiro a ${monthlyRatePercent}% ao mês.`
      : betterOption === 'cash'
        ? `Pagar à vista é melhor: parcelar sai ${formatBRL(Math.abs(finalBalanceCents))} mais caro no fim.`
        : 'Dá no mesmo: as duas opções terminam com o mesmo dinheiro no bolso.';

  return {
    cashTotalCents: cashPriceCents,
    installmentTotalCents,
    differenceCents: installmentTotalCents - cashPriceCents,
    investmentGainCents,
    finalBalanceCents,
    implicitMonthlyRatePercent,
    implicitAnnualRatePercent,
    betterOption,
    verdict,
  };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/simulator.test.ts`
Expected: PASS — 19 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulator.ts src/lib/simulator.test.ts
git commit -m "feat: simulador de compra a vista x parcelada com juros embutidos"
```

---

### Task 7: `lib/forecast.ts` — saldo previsto do fim do mês

**Files:**
- Create: `src/lib/forecast.ts`
- Test: `src/lib/forecast.test.ts`

**Interfaces:**
- Consumes: `types.ts` (`Transaction`)
- Produces:
  - `balanceOf(transactions: Transaction[]): number`
  - `pendingRecurring(previousMonth: Transaction[], currentMonth: Transaction[]): Transaction[]`
  - `forecastEndOfMonth(input: ForecastInput): number`
  - `interface ForecastInput { currentBalanceCents; pending; futureThisMonthCents }`
  - `committedFutureCents(transactions: Transaction[], monthEndISO: string): number`

**As definições exatas, para não haver dupla contagem:**

- `currentBalanceCents` — receitas menos despesas com data **até hoje, inclusive**
- `futureThisMonthCents` — despesas com data **depois de hoje e até o fim do mês**, já registradas (inclui parcelas de compras antigas)
- `pending` — recorrentes do mês anterior sem equivalente **em nenhum lugar do mês atual**, nem passado nem futuro. Por isso não colidem com `futureThisMonthCents`

`Saldo Previsto = currentBalance + receitas pendentes − despesas pendentes − futureThisMonth`

**Regra de equivalência de recorrente:** mesma categoria, mesmo valor e mesmo tipo. A comparação é por multiconjunto: se o mês passado tem duas assinaturas idênticas e este mês só uma foi lançada, sobra uma pendente.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/forecast.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { balanceOf, pendingRecurring, forecastEndOfMonth, committedFutureCents } from './forecast';
import type { Transaction } from './types';

/** Constrói uma transação com os campos que os testes não usam já preenchidos. */
function tx(over: Partial<Transaction> & Pick<Transaction, 'amountCents' | 'type'>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-08-10',
    categoryId: 'cat-1',
    description: '',
    paymentMethod: 'pix',
    creditCardId: null,
    installmentPlanId: null,
    installmentNumber: null,
    isRecurring: false,
    ...over,
  };
}

describe('balanceOf', () => {
  it('soma receitas e subtrai despesas', () => {
    const t = [
      tx({ amountCents: 500000, type: 'income' }),
      tx({ amountCents: 150000, type: 'expense' }),
      tx({ amountCents: 60000, type: 'expense' }),
    ];
    expect(balanceOf(t)).toBe(290000);
  });

  it('lista vazia da saldo zero', () => {
    expect(balanceOf([])).toBe(0);
  });

  it('so despesas da saldo negativo', () => {
    expect(balanceOf([tx({ amountCents: 10000, type: 'expense' })])).toBe(-10000);
  });
});

describe('pendingRecurring', () => {
  it('aponta a recorrente do mes passado que ainda nao foi lancada', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];
    const atual: Transaction[] = [];

    const pendentes = pendingRecurring(anterior, atual);
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].categoryId).toBe('moradia');
  });

  it('ignora a recorrente que ja foi lancada neste mes', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(0);
  });

  it('ignora a recorrente ja lancada mesmo com data no futuro do mes', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true, date: '2026-07-05' }),
    ];
    const atual = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true, date: '2026-08-28' }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(0);
  });

  it('nao considera transacoes que nao sao recorrentes', () => {
    const anterior = [
      tx({ amountCents: 60000, type: 'expense', categoryId: 'mercado', isRecurring: false }),
    ];
    expect(pendingRecurring(anterior, [])).toHaveLength(0);
  });

  it('valor diferente na mesma categoria conta como pendente', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 160000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(1);
  });

  it('conta por multiconjunto quando ha recorrentes identicas', () => {
    const anterior = [
      tx({ amountCents: 5000, type: 'expense', categoryId: 'assinaturas', isRecurring: true }),
      tx({ amountCents: 5000, type: 'expense', categoryId: 'assinaturas', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 5000, type: 'expense', categoryId: 'assinaturas', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(1);
  });

  it('distingue receita de despesa de mesmo valor e categoria', () => {
    const anterior = [
      tx({ amountCents: 5000, type: 'income', categoryId: 'x', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 5000, type: 'expense', categoryId: 'x', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(1);
  });
});

describe('forecastEndOfMonth', () => {
  it('soma receitas pendentes e subtrai despesas pendentes e futuras', () => {
    const previsto = forecastEndOfMonth({
      currentBalanceCents: 290000,
      pending: [
        tx({ amountCents: 100000, type: 'income', isRecurring: true }),
        tx({ amountCents: 30000, type: 'expense', isRecurring: true }),
      ],
      futureThisMonthCents: 50000,
    });

    expect(previsto).toBe(290000 + 100000 - 30000 - 50000);
  });

  it('sem pendentes e sem futuras o previsto e o saldo atual', () => {
    expect(
      forecastEndOfMonth({ currentBalanceCents: 12345, pending: [], futureThisMonthCents: 0 }),
    ).toBe(12345);
  });

  it('pode ficar negativo', () => {
    expect(
      forecastEndOfMonth({ currentBalanceCents: 10000, pending: [], futureThisMonthCents: 30000 }),
    ).toBe(-20000);
  });
});

describe('committedFutureCents', () => {
  it('soma as parcelas com vencimento depois do fim do mes', () => {
    const t = [
      tx({ amountCents: 30000, type: 'expense', date: '2026-08-27', installmentPlanId: 'p1' }),
      tx({ amountCents: 30000, type: 'expense', date: '2026-09-27', installmentPlanId: 'p1' }),
      tx({ amountCents: 30000, type: 'expense', date: '2026-10-27', installmentPlanId: 'p1' }),
    ];

    expect(committedFutureCents(t, '2026-08-31')).toBe(60000);
  });

  it('ignora transacoes que nao sao parcelas', () => {
    const t = [
      tx({ amountCents: 99999, type: 'expense', date: '2026-12-01', installmentPlanId: null }),
    ];
    expect(committedFutureCents(t, '2026-08-31')).toBe(0);
  });

  it('devolve zero quando nao ha parcela futura', () => {
    expect(committedFutureCents([], '2026-08-31')).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/forecast.test.ts`
Expected: FAIL — `Failed to resolve import "./forecast"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/forecast.ts`:

```ts
import type { Transaction } from './types';

export interface ForecastInput {
  /** Receitas menos despesas com data até hoje, inclusive. */
  currentBalanceCents: number;
  /** Recorrentes do mês passado ainda sem equivalente neste mês. */
  pending: Transaction[];
  /** Despesas já registradas com data depois de hoje e até o fim do mês. */
  futureThisMonthCents: number;
}

/** Receitas menos despesas. */
export function balanceOf(transactions: Transaction[]): number {
  return transactions.reduce(
    (total, t) => total + (t.type === 'income' ? t.amountCents : -t.amountCents),
    0,
  );
}

/** Duas recorrentes são "a mesma" se batem tipo, categoria e valor. */
function recurringKey(t: Transaction): string {
  return `${t.type}|${t.categoryId}|${t.amountCents}`;
}

/**
 * Quais recorrentes do mês anterior ainda não apareceram neste mês.
 * A comparação é por multiconjunto: duas assinaturas idênticas no mês passado
 * e uma lançada neste mês deixam uma pendente.
 */
export function pendingRecurring(
  previousMonth: Transaction[],
  currentMonth: Transaction[],
): Transaction[] {
  const disponiveis = new Map<string, number>();
  for (const t of currentMonth) {
    if (!t.isRecurring) continue;
    const k = recurringKey(t);
    disponiveis.set(k, (disponiveis.get(k) ?? 0) + 1);
  }

  const pendentes: Transaction[] = [];
  for (const t of previousMonth) {
    if (!t.isRecurring) continue;

    const k = recurringKey(t);
    const restante = disponiveis.get(k) ?? 0;

    if (restante > 0) disponiveis.set(k, restante - 1);
    else pendentes.push(t);
  }

  return pendentes;
}

/**
 * Saldo projetado para o fim do mês.
 * É uma projeção, não uma certeza — a interface diz isso ao lado do número.
 */
export function forecastEndOfMonth(input: ForecastInput): number {
  const { currentBalanceCents, pending, futureThisMonthCents } = input;
  return currentBalanceCents + balanceOf(pending) - futureThisMonthCents;
}

/**
 * Total de parcelas que vencem depois do fim do mês corrente.
 * É o "Comprometido com parcelas futuras" do dashboard: o dinheiro que já está
 * prometido mas ainda não apareceu em nenhum mês.
 */
export function committedFutureCents(
  transactions: Transaction[],
  monthEndISO: string,
): number {
  return transactions
    .filter((t) => t.installmentPlanId !== null && t.date > monthEndISO)
    .reduce((total, t) => total + t.amountCents, 0);
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/forecast.test.ts`
Expected: PASS — 16 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/forecast.ts src/lib/forecast.test.ts
git commit -m "feat: saldo previsto e parcelas futuras comprometidas"
```

---

### Task 8: `lib/insights.ts` — as frases de alerta do dashboard

**Files:**
- Create: `src/lib/insights.ts`
- Test: `src/lib/insights.test.ts`

**Interfaces:**
- Consumes: `types.ts` (`BudgetStatus`), `money.ts` (`formatBRL`)
- Produces:
  - `type InsightSeverity = 'danger' | 'warning' | 'success' | 'info'`
  - `interface Insight { id: string; severity: InsightSeverity; message: string }`
  - `interface InsightInput { budgets; dayOfMonth; daysInMonth; totalIncomeCents; totalExpenseCents; transactionCount }`
  - `buildInsights(input: InsightInput): Insight[]` — no máximo 3, mais grave primeiro
  - `budgetColor(spentCents: number, limitCents: number | null): 'green' | 'yellow' | 'red' | 'none'`

**As cinco regras, em ordem de gravidade:**

1. `danger` — orçamento estourado: gasto ≥ teto
2. `danger` — despesas do mês passaram as receitas
3. `warning` — orçamento em risco: gasto ≥ 70% do teto **e** o ritmo está adiantado (fração gasta maior que a fração do mês já percorrida)
4. `success` — guardou 20% ou mais do que ganhou
5. `info` — nenhum lançamento no mês

**Limites de cor do orçamento**, exatos: verde **abaixo** de 70%; amarelo de 70% **inclusive** até abaixo de 100%; vermelho a partir de 100% **inclusive**. Teto `null` devolve `'none'` — ausência de orçamento não é orçamento zero.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/insights.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildInsights, budgetColor } from './insights';
import type { BudgetStatus } from './types';

function budget(over: Partial<BudgetStatus> = {}): BudgetStatus {
  return {
    categoryId: 'lazer',
    categoryName: 'Lazer e Entretenimento',
    categoryEmoji: '🎬',
    limitCents: 50000,
    spentCents: 0,
    ...over,
  };
}

const base = {
  budgets: [] as BudgetStatus[],
  dayOfMonth: 15,
  daysInMonth: 31,
  totalIncomeCents: 500000,
  totalExpenseCents: 200000,
  transactionCount: 10,
};

describe('budgetColor', () => {
  it('devolve none quando nao ha teto definido', () => {
    expect(budgetColor(10000, null)).toBe('none');
  });

  it('e verde em zero por cento', () => {
    expect(budgetColor(0, 50000)).toBe('green');
  });

  it('e verde logo abaixo de 70 por cento', () => {
    expect(budgetColor(34999, 50000)).toBe('green');
  });

  it('e amarelo exatamente em 70 por cento', () => {
    expect(budgetColor(35000, 50000)).toBe('yellow');
  });

  it('e amarelo logo abaixo de 100 por cento', () => {
    expect(budgetColor(49999, 50000)).toBe('yellow');
  });

  it('e vermelho exatamente em 100 por cento', () => {
    expect(budgetColor(50000, 50000)).toBe('red');
  });

  it('e vermelho acima de 100 por cento', () => {
    expect(budgetColor(60000, 50000)).toBe('red');
  });

  it('teto zero com gasto zero e vermelho', () => {
    expect(budgetColor(0, 0)).toBe('red');
  });
});

describe('buildInsights — orcamento estourado', () => {
  it('avisa quanto passou do teto', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 62000, limitCents: 50000 })],
    });

    expect(r[0].severity).toBe('danger');
    expect(r[0].message).toContain('🎬 Lazer e Entretenimento');
    expect(r[0].message).toContain('R$ 120,00');
  });
});

describe('buildInsights — orcamento em risco', () => {
  it('avisa quando o ritmo esta adiantado', () => {
    // 80% do teto gasto, mas só 48% do mês percorrido.
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 40000, limitCents: 50000 })],
      dayOfMonth: 15,
      daysInMonth: 31,
    });

    const risco = r.find((i) => i.severity === 'warning');
    expect(risco).toBeDefined();
    expect(risco!.message).toContain('80%');
    expect(risco!.message).toContain('🎬 Lazer e Entretenimento');
    expect(risco!.message).toContain('16 dias');
  });

  it('nao avisa quando o gasto acompanha o ritmo do mes', () => {
    // 71% do teto gasto com 90% do mês percorrido: está no ritmo.
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 35500, limitCents: 50000 })],
      dayOfMonth: 28,
      daysInMonth: 31,
    });

    expect(r.find((i) => i.severity === 'warning')).toBeUndefined();
  });

  it('nao avisa abaixo de 70 por cento', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 30000, limitCents: 50000 })],
      dayOfMonth: 2,
      daysInMonth: 31,
    });

    expect(r.find((i) => i.severity === 'warning')).toBeUndefined();
  });

  it('ignora categoria sem teto definido', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 999999, limitCents: null })],
    });

    expect(r.find((i) => i.severity === 'danger')).toBeUndefined();
    expect(r.find((i) => i.severity === 'warning')).toBeUndefined();
  });
});

describe('buildInsights — resultado do mes', () => {
  it('avisa quando as despesas passam as receitas', () => {
    const r = buildInsights({
      ...base,
      totalIncomeCents: 200000,
      totalExpenseCents: 250000,
    });

    const alerta = r.find((i) => i.message.includes('gastou mais do que ganhou'));
    expect(alerta).toBeDefined();
    expect(alerta!.severity).toBe('danger');
    expect(alerta!.message).toContain('R$ 500,00');
  });

  it('elogia quando guardou 20 por cento ou mais', () => {
    const r = buildInsights({
      ...base,
      totalIncomeCents: 500000,
      totalExpenseCents: 400000,
    });

    const elogio = r.find((i) => i.severity === 'success');
    expect(elogio).toBeDefined();
    expect(elogio!.message).toContain('20%');
  });

  it('nao elogia quando guardou menos de 20 por cento', () => {
    const r = buildInsights({
      ...base,
      totalIncomeCents: 500000,
      totalExpenseCents: 450000,
    });

    expect(r.find((i) => i.severity === 'success')).toBeUndefined();
  });

  it('nao divide por zero quando nao ha receita', () => {
    const r = buildInsights({ ...base, totalIncomeCents: 0, totalExpenseCents: 0, transactionCount: 1 });
    expect(r.every((i) => !i.message.includes('NaN'))).toBe(true);
  });
});

describe('buildInsights — mes vazio', () => {
  it('convida a comecar quando nao ha nenhum lancamento', () => {
    const r = buildInsights({
      ...base,
      transactionCount: 0,
      totalIncomeCents: 0,
      totalExpenseCents: 0,
    });

    expect(r).toHaveLength(1);
    expect(r[0].severity).toBe('info');
    expect(r[0].message).toContain('Nenhum lançamento');
  });
});

describe('buildInsights — ordenacao e limite', () => {
  it('mostra no maximo tres avisos', () => {
    const r = buildInsights({
      ...base,
      budgets: [
        budget({ categoryId: 'a', categoryName: 'A', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'b', categoryName: 'B', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'c', categoryName: 'C', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'd', categoryName: 'D', spentCents: 60000, limitCents: 50000 }),
      ],
    });

    expect(r).toHaveLength(3);
  });

  it('coloca o mais grave primeiro', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 40000, limitCents: 50000 })],
      totalIncomeCents: 200000,
      totalExpenseCents: 250000,
      dayOfMonth: 15,
      daysInMonth: 31,
    });

    expect(r[0].severity).toBe('danger');
  });

  it('cada aviso tem um id unico', () => {
    const r = buildInsights({
      ...base,
      budgets: [
        budget({ categoryId: 'a', categoryName: 'A', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'b', categoryName: 'B', spentCents: 60000, limitCents: 50000 }),
      ],
    });

    expect(new Set(r.map((i) => i.id)).size).toBe(r.length);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/insights.test.ts`
Expected: FAIL — `Failed to resolve import "./insights"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/insights.ts`:

```ts
import type { BudgetStatus } from './types';
import { formatBRL } from './money';

export type InsightSeverity = 'danger' | 'warning' | 'success' | 'info';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  message: string;
}

export interface InsightInput {
  budgets: BudgetStatus[];
  /** Dia de hoje dentro do mês (1–31). */
  dayOfMonth: number;
  daysInMonth: number;
  totalIncomeCents: number;
  totalExpenseCents: number;
  transactionCount: number;
}

const ORDEM: Record<InsightSeverity, number> = {
  danger: 0,
  warning: 1,
  success: 2,
  info: 3,
};

const LIMITE_ATENCAO = 0.7;

/**
 * A cor da barra de orçamento.
 * Verde abaixo de 70%, amarelo de 70% até abaixo de 100%, vermelho de 100%
 * em diante. Sem teto definido não tem cor — não é o mesmo que teto zero.
 */
export function budgetColor(
  spentCents: number,
  limitCents: number | null,
): 'green' | 'yellow' | 'red' | 'none' {
  if (limitCents === null) return 'none';
  if (limitCents <= 0) return 'red';

  const fracao = spentCents / limitCents;
  if (fracao >= 1) return 'red';
  if (fracao >= LIMITE_ATENCAO) return 'yellow';
  return 'green';
}

/**
 * Traduz os números do mês em no máximo três frases que a pessoa entende sem
 * saber nada de finanças. Mais grave primeiro.
 */
export function buildInsights(input: InsightInput): Insight[] {
  const {
    budgets,
    dayOfMonth,
    daysInMonth,
    totalIncomeCents,
    totalExpenseCents,
    transactionCount,
  } = input;

  // Mês sem nenhum lançamento não tem o que analisar.
  if (transactionCount === 0) {
    return [
      {
        id: 'mes-vazio',
        severity: 'info',
        message:
          'Nenhum lançamento neste mês ainda. Comece registrando uma despesa para ver seus números aqui.',
      },
    ];
  }

  const avisos: Insight[] = [];
  const diasRestantes = Math.max(0, daysInMonth - dayOfMonth);
  const fracaoDoMes = dayOfMonth / daysInMonth;

  for (const b of budgets) {
    if (b.limitCents === null || b.limitCents <= 0) continue;

    const fracaoGasta = b.spentCents / b.limitCents;
    const nome = `${b.categoryEmoji} ${b.categoryName}`;

    if (fracaoGasta >= 1) {
      avisos.push({
        id: `estourou-${b.categoryId}`,
        severity: 'danger',
        message: `Você estourou o orçamento de ${nome} em ${formatBRL(b.spentCents - b.limitCents)}.`,
      });
    } else if (fracaoGasta >= LIMITE_ATENCAO && fracaoGasta > fracaoDoMes) {
      const pct = Math.round(fracaoGasta * 100);
      avisos.push({
        id: `risco-${b.categoryId}`,
        severity: 'warning',
        message: `Você já usou ${pct}% do orçamento de ${nome} e ainda faltam ${diasRestantes} dias para o mês fechar.`,
      });
    }
  }

  if (totalExpenseCents > totalIncomeCents) {
    avisos.push({
      id: 'no-vermelho',
      severity: 'danger',
      message: `Você gastou mais do que ganhou neste mês — ${formatBRL(totalExpenseCents - totalIncomeCents)} a mais.`,
    });
  } else if (totalIncomeCents > 0) {
    const guardado = (totalIncomeCents - totalExpenseCents) / totalIncomeCents;
    if (guardado >= 0.2) {
      avisos.push({
        id: 'boa-poupanca',
        severity: 'success',
        message: `Você guardou ${Math.round(guardado * 100)}% do que ganhou neste mês. Continue assim.`,
      });
    }
  }

  return avisos
    .sort((a, b) => ORDEM[a.severity] - ORDEM[b.severity])
    .slice(0, 3);
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/insights.test.ts`
Expected: PASS — 21 testes.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — todos os módulos de cálculo verdes. Este é o marco: a matemática do app está fechada e provada antes de existir qualquer tela.

- [ ] **Step 6: Commit**

```bash
git add src/lib/insights.ts src/lib/insights.test.ts
git commit -m "feat: insights do dashboard em portugues claro e cores de orcamento"
```

---

### Task 9: Projeto Supabase e esquema do banco

**Files:**
- Create: `supabase/migrations/0001_schema.sql`
- Create: `supabase/migrations/0002_rls.sql`
- Create: `supabase/migrations/0003_seed_categories.sql`
- Modify: `.env.local` (não versionado)

**Interfaces:**
- Consumes: nada
- Produces: banco com as tabelas `profiles`, `categories`, `credit_cards`, `installment_plans`, `transactions`, `budgets`, `import_batches`; RLS ativa; trigger que cria perfil e 32 categorias no cadastro

**Atenção — valores reais:** o projeto existente `GuiKolesne's Project` (`gyrjrllarelybqrjqrjo`) pertence ao sistema de esquadrias e **não deve ser tocado**. Criar um projeto novo. A URL e a chave publicável vêm das ferramentas do Supabase; nunca inventar um valor que pareça real.

- [ ] **Step 1: Criar o projeto Supabase**

Usar a ferramenta MCP `create_project` na organização `bpajxmwytwzbpfvxrphi`, com nome `financas-pessoais` e região `us-east-2` (mesma do projeto existente, menor latência a partir do Brasil que as regiões europeias).

Antes de criar, chamar `get_cost` e `confirm_cost` conforme o fluxo exigido pela ferramenta. **Confirmar com o usuário antes de criar**, mostrando o custo retornado.

Aguardar `status: ACTIVE_HEALTHY` via `get_project` antes de seguir.

- [ ] **Step 2: Guardar as credenciais**

Obter `get_project_url` e `get_publishable_keys` do projeto novo. Escrever em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<url retornada pela ferramenta>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave publicável retornada pela ferramenta>
```

Confirmar que `.env.local` está no `.gitignore` antes de qualquer commit.

- [ ] **Step 3: Escrever a migração do esquema**

Criar `supabase/migrations/0001_schema.sql`:

```sql
-- Tipos do domínio.
create type transaction_type as enum ('income', 'expense');
create type payment_method as enum ('pix', 'debit', 'cash', 'credit');
create type import_source as enum ('notification', 'ofx', 'csv');
create type import_status as enum ('pending', 'confirmed', 'discarded');

-- Mantém updated_at em dia sem depender do código da aplicação.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  emoji text not null default '',
  color text not null default '#64748b',
  type transaction_type not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_user_type_idx on categories (user_id, type) where not is_archived;

create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nickname text not null,
  brand text not null default '',
  limit_cents integer not null default 0 check (limit_cents >= 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color text not null default '#7c3aed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index credit_cards_user_idx on credit_cards (user_id);

-- A "compra-mãe" de um parcelamento. Apagar aqui apaga as parcelas filhas.
create table installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  description text not null default '',
  total_cents integer not null check (total_cents >= 0),
  installments_count smallint not null check (installments_count between 1 and 60),
  purchase_date date not null,
  credit_card_id uuid not null references credit_cards on delete cascade,
  category_id uuid not null references categories on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index installment_plans_user_idx on installment_plans (user_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- Data de competência. Para parcelas, é o vencimento da fatura.
  date date not null,
  -- Sempre positivo: o sinal vem da coluna type.
  amount_cents integer not null check (amount_cents >= 0),
  type transaction_type not null,
  category_id uuid not null references categories on delete restrict,
  description text not null default '',
  payment_method payment_method not null default 'pix',
  credit_card_id uuid references credit_cards on delete set null,
  installment_plan_id uuid references installment_plans on delete cascade,
  installment_number smallint check (installment_number is null or installment_number >= 1),
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Pagamento no crédito exige dizer qual cartão.
  constraint credito_exige_cartao
    check (payment_method <> 'credit' or credit_card_id is not null),
  -- Ou é parcela (tem plano e número) ou não é nenhum dos dois.
  constraint parcela_tem_plano_e_numero
    check ((installment_plan_id is null) = (installment_number is null))
);
create index transactions_user_date_idx on transactions (user_id, date desc);
create index transactions_user_category_idx on transactions (user_id, category_id);
create index transactions_plan_idx on transactions (installment_plan_id)
  where installment_plan_id is not null;

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid not null references categories on delete cascade,
  -- Sempre o primeiro dia do mês.
  month date not null,
  limit_cents integer not null check (limit_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mes_e_dia_primeiro check (extract(day from month) = 1),
  unique (user_id, category_id, month)
);
create index budgets_user_month_idx on budgets (user_id, month);

-- Criada agora, usada só na Fase 2 (leitor de notificações e OFX/CSV).
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  source import_source not null,
  raw_input text not null default '',
  status import_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger categories_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger credit_cards_updated_at before update on credit_cards
  for each row execute function set_updated_at();
create trigger installment_plans_updated_at before update on installment_plans
  for each row execute function set_updated_at();
create trigger transactions_updated_at before update on transactions
  for each row execute function set_updated_at();
create trigger budgets_updated_at before update on budgets
  for each row execute function set_updated_at();
create trigger import_batches_updated_at before update on import_batches
  for each row execute function set_updated_at();
```

- [ ] **Step 4: Aplicar a migração do esquema**

Usar a ferramenta MCP `apply_migration` no **projeto novo**, com nome `0001_schema` e o conteúdo do arquivo.

Conferir com `list_tables` que as sete tabelas existem.

- [ ] **Step 5: Escrever a migração de RLS**

Criar `supabase/migrations/0002_rls.sql`:

```sql
-- Sem RLS, qualquer pessoa com a chave publicável leria o banco inteiro.
-- Estas políticas são a proteção real do app; a interface não é proteção.
alter table profiles         enable row level security;
alter table categories       enable row level security;
alter table credit_cards     enable row level security;
alter table installment_plans enable row level security;
alter table transactions     enable row level security;
alter table budgets          enable row level security;
alter table import_batches   enable row level security;

-- profiles se identifica por id, não por user_id.
create policy "dono cuida do proprio perfil" on profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "dono cuida das proprias categorias" on categories
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dono cuida dos proprios cartoes" on credit_cards
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dono cuida das proprias compras parceladas" on installment_plans
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dono cuida dos proprios lancamentos" on transactions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dono cuida dos proprios orcamentos" on budgets
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "dono cuida das proprias importacoes" on import_batches
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 6: Aplicar a migração de RLS**

`apply_migration` com nome `0002_rls`.

Rodar `get_advisors` com `type: "security"`. Expected: nenhum aviso de tabela exposta sem RLS. Se aparecer algum, corrigir antes de seguir.

- [ ] **Step 7: Escrever a migração de categorias iniciais**

Criar `supabase/migrations/0003_seed_categories.sql`. As 32 categorias são exatamente as da planilha do usuário:

```sql
-- Ao criar a conta, o usuário já encontra o app utilizável: perfil criado e
-- as 32 categorias da planilha antiga prontas para uso.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.categories (user_id, name, emoji, color, type) values
    (new.id, 'Moradia (Aluguel/Financiamento)', '🏠', '#ef4444', 'expense'),
    (new.id, 'Contas (Água, Luz, Gás)',         '⚡', '#f97316', 'expense'),
    (new.id, 'Internet e Telefone',             '📱', '#f59e0b', 'expense'),
    (new.id, 'Transporte (Combustível)',        '🚗', '#eab308', 'expense'),
    (new.id, 'Transporte (Manutenção)',         '🔧', '#84cc16', 'expense'),
    (new.id, 'Transporte Público',              '🚌', '#22c55e', 'expense'),
    (new.id, 'Supermercado',                    '🛒', '#10b981', 'expense'),
    (new.id, 'Delivery & Restaurantes',         '🍔', '#14b8a6', 'expense'),
    (new.id, 'Saúde (Plano/Consultas)',         '🏥', '#06b6d4', 'expense'),
    (new.id, 'Medicamentos',                    '💊', '#0ea5e9', 'expense'),
    (new.id, 'Educação (Cursos)',               '📚', '#3b82f6', 'expense'),
    (new.id, 'Livros e Materiais',              '📖', '#6366f1', 'expense'),
    (new.id, 'Lazer e Entretenimento',          '🎬', '#8b5cf6', 'expense'),
    (new.id, 'Assinaturas (Streaming, etc)',    '📺', '#a855f7', 'expense'),
    (new.id, 'Vestuário',                       '👕', '#d946ef', 'expense'),
    (new.id, 'Beleza e Cuidados',               '💄', '#ec4899', 'expense'),
    (new.id, 'Presentes e Doações',             '🎁', '#f43f5e', 'expense'),
    (new.id, 'Pets',                            '🐕', '#a16207', 'expense'),
    (new.id, 'Seguros',                         '🛡️', '#57534e', 'expense'),
    (new.id, 'Impostos',                        '📋', '#44403c', 'expense'),
    (new.id, 'Outros',                          '📌', '#64748b', 'expense'),
    (new.id, 'Salário',                         '💼', '#16a34a', 'income'),
    (new.id, 'Freelance',                       '💻', '#22c55e', 'income'),
    (new.id, 'Bônus',                           '🎉', '#4ade80', 'income'),
    (new.id, '13º Salário',                     '🎄', '#15803d', 'income'),
    (new.id, 'Férias',                          '🏖️', '#65a30d', 'income'),
    (new.id, 'Investimentos (Dividendos)',      '📈', '#0d9488', 'income'),
    (new.id, 'Investimentos (Juros)',           '💰', '#0891b2', 'income'),
    (new.id, 'Aluguel Recebido',                '🏘️', '#2563eb', 'income'),
    (new.id, 'Vendas',                          '🛍️', '#7c3aed', 'income'),
    (new.id, 'Prêmios',                         '🏆', '#c026d3', 'income'),
    (new.id, 'Outros',                          '📌', '#64748b', 'income');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

- [ ] **Step 8: Aplicar a migração de categorias**

`apply_migration` com nome `0003_seed_categories`.

- [ ] **Step 9: Verificar o trigger com um usuário descartável**

Criar um usuário pelo painel ou pela API de auth e conferir:

```sql
select type, count(*) from categories
where user_id = '<id do usuario criado>'
group by type;
```

Expected: `expense = 21`, `income = 11`. Conferir também que existe uma linha em `profiles`.

Apagar o usuário descartável depois de verificar.

- [ ] **Step 10: Gerar os tipos TypeScript do banco**

Usar `generate_typescript_types` e salvar o resultado em `src/lib/supabase/database.types.ts`.

- [ ] **Step 11: Commit**

```bash
git add supabase/ src/lib/supabase/database.types.ts .env.example
git commit -m "feat: esquema do banco com RLS e 32 categorias iniciais"
```

---

### Task 10: Prova de que o isolamento entre usuários funciona

**Files:**
- Create: `scripts/prova-rls.md` (o registro do que foi testado e do resultado)

**Interfaces:**
- Consumes: banco da Tarefa 9
- Produces: evidência de que um usuário não enxerga nem altera dados de outro

Esta tarefa não escreve código de aplicação. Ela existe porque a interface não é prova de segurança: um `select` sem filtro no código, com RLS mal configurada, vaza o banco inteiro. A verificação é feita por fora do app, direto na API.

- [ ] **Step 1: Criar dois usuários de teste**

Pelo endpoint de signup, usando a URL e a chave publicável do `.env.local`:

```bash
curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste-a@exemplo.com","password":"senha-forte-de-teste-A1"}'
```

Repetir para `teste-b@exemplo.com`. Guardar o `access_token` de cada resposta.

Se a resposta exigir confirmação de e-mail, desligar "Confirm email" em Authentication → Providers → Email no painel do projeto e repetir.

- [ ] **Step 2: Usuário A cria um lançamento**

Pegar um `category_id` de A:

```bash
curl -s "$SUPABASE_URL/rest/v1/categories?select=id,name&type=eq.expense&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TOKEN_A"
```

Criar o lançamento:

```bash
curl -s -X POST "$SUPABASE_URL/rest/v1/transactions" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"user_id":"'"$USER_A_ID"'","date":"2026-08-10","amount_cents":12345,"type":"expense","category_id":"'"$CAT_A"'","description":"lancamento do usuario A"}'
```

Expected: HTTP 201 com o registro criado.

- [ ] **Step 3: Provar que B não lê o lançamento de A**

```bash
curl -s "$SUPABASE_URL/rest/v1/transactions?select=id,description" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TOKEN_B"
```

Expected: `[]`. Se aparecer o lançamento de A, **parar tudo** e corrigir a política antes de continuar o projeto.

- [ ] **Step 4: Provar que B não consegue gravar como A**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$SUPABASE_URL/rest/v1/transactions" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"'"$USER_A_ID"'","date":"2026-08-10","amount_cents":1,"type":"expense","category_id":"'"$CAT_A"'"}'
```

Expected: `403`. A cláusula `with check` é o que barra isso.

- [ ] **Step 5: Provar que B não consegue apagar o lançamento de A**

```bash
curl -s -X DELETE "$SUPABASE_URL/rest/v1/transactions?id=eq.$TX_A" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TOKEN_B"
```

Depois conferir com o token de A que o lançamento continua lá. Expected: o registro de A permanece.

- [ ] **Step 6: Provar que sem token nada é lido**

```bash
curl -s "$SUPABASE_URL/rest/v1/transactions?select=id" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

Expected: `[]` (a política é `to authenticated`; requisição anônima não casa com nenhuma).

- [ ] **Step 7: Repetir os passos 3 e 4 para categorias, cartões e orçamentos**

As mesmas duas provas — B não lê o de A, B não grava como A — para `categories`, `credit_cards` e `budgets`. Expected: `[]` na leitura e `403` na escrita, em todas.

- [ ] **Step 8: Registrar as evidências**

Criar `scripts/prova-rls.md` com cada comando executado e a resposta obtida, sem incluir tokens nem senhas no arquivo. Este documento é o que responde "como você sabe que está seguro?".

- [ ] **Step 9: Apagar os usuários de teste**

Remover `teste-a@exemplo.com` e `teste-b@exemplo.com` pelo painel de Authentication.

- [ ] **Step 10: Commit**

```bash
git add scripts/prova-rls.md
git commit -m "test: prova por API de que o isolamento entre usuarios funciona"
```

---

### Task 11: Autenticação — clients do Supabase, login e sessão

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`
- Create: `src/app/auth/callback/route.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `.env.local` da Tarefa 9
- Produces:
  - `createServerSupabase(): Promise<SupabaseClient>` — para Server Components e Server Actions
  - `createBrowserSupabase(): SupabaseClient` — para Client Components
  - `updateSession(request: NextRequest): Promise<NextResponse>`
  - `requireUser(): Promise<User>` — devolve o usuário logado ou redireciona para `/login`
  - Server Actions `signIn`, `signUp`, `signOut`

- [ ] **Step 1: Criar o client de servidor**

Criar `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from './database.types';

/** Client para Server Components e Server Actions. Lê a sessão do cookie. */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component não pode escrever cookie. O middleware já
            // renovou a sessão, então ignorar aqui é seguro.
          }
        },
      },
    },
  );
}

/**
 * Usuário da requisição atual. Manda para o login se não houver sessão.
 * Toda página autenticada começa por aqui.
 */
export async function requireUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect('/login');
  return data.user;
}
```

- [ ] **Step 2: Criar o client de navegador**

Criar `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/** Client para Client Components — usado só no login com Google e no logout. */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Criar a renovação de sessão do middleware**

Criar `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Renova o token de sessão a cada navegação e barra quem não está logado.
 * Sem isso, a sessão expira no meio do uso e a pessoa é deslogada sem aviso.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();

  const rotaPublica =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth');

  if (!data.user && !rotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}
```

Criar `src/middleware.ts`:

```ts
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 4: Criar as Server Actions de login**

Criar `src/app/login/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const credenciais = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.'),
});

export type AuthState = { error: string | null };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credenciais.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Mensagem genérica de propósito: não confirmamos se o e-mail existe.
    return { error: 'E-mail ou senha incorretos.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credenciais.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: 'Não consegui criar a conta. Talvez esse e-mail já esteja cadastrado.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
```

- [ ] **Step 5: Criar a rota de retorno do Google**

Criar `src/app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/** Para onde o Google devolve a pessoa depois de autorizar. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/login?erro=google`);
}
```

- [ ] **Step 6: Criar a tela de login**

Criar `src/app/login/page.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { signIn, signUp, type AuthState } from './actions';
import { createBrowserSupabase } from '@/lib/supabase/client';

const estadoInicial: AuthState = { error: null };

export default function LoginPage() {
  const [estado, entrar, entrando] = useActionState(signIn, estadoInicial);
  const [estadoCadastro, cadastrar, cadastrando] = useActionState(signUp, estadoInicial);

  const erro = estado.error ?? estadoCadastro.error;

  async function entrarComGoogle() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Suas finanças
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Entre para ver seus lançamentos e orçamentos.
          </p>
        </header>

        <form className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Senha</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          {erro && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {erro}
            </p>
          )}

          <button
            formAction={entrar}
            disabled={entrando}
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>

          <button
            formAction={cadastrar}
            disabled={cadastrando}
            className="w-full rounded-lg border border-slate-300 py-2.5 font-medium text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
          >
            {cadastrando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          ou
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <button
          onClick={entrarComGoogle}
          className="w-full rounded-lg border border-slate-300 py-2.5 font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
        >
          Entrar com Google
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Configurar o Google OAuth**

Este passo **depende de valores que só o usuário tem** — não inventar nada.

Perguntar ao usuário se ele já tem um projeto no Google Cloud com credenciais OAuth. Se não tiver, guiá-lo:

1. Google Cloud Console → APIs e Serviços → Credenciais → Criar credencial → ID do cliente OAuth → Aplicativo da Web
2. Em "URIs de redirecionamento autorizados", colar a URL de callback do Supabase, que aparece no painel do projeto em Authentication → Providers → Google
3. Copiar o Client ID e o Client Secret gerados
4. Colar os dois no painel do Supabase em Authentication → Providers → Google e ativar o provedor

Se o usuário preferir adiar, o botão "Entrar com Google" mostra erro ao ser clicado. Nesse caso, esconder o botão e o separador "ou" até a configuração existir — não deixar um botão quebrado na tela.

- [ ] **Step 8: Verificar o fluxo completo**

Run: `npm run dev`

Verificar, nesta ordem:
1. Abrir `http://localhost:3000/` sem estar logado → redireciona para `/login`
2. Criar uma conta com e-mail e senha → entra e vai para `/`
3. Conferir no banco que a conta ganhou 32 categorias e uma linha em `profiles`
4. Recarregar a página → continua logado
5. Se o Google foi configurado no Step 7, testar "Entrar com Google"

- [ ] **Step 9: Commit**

```bash
git add src/lib/supabase src/middleware.ts src/app/login src/app/auth
git commit -m "feat: autenticacao com email e senha, Google e renovacao de sessao"
```

---

### Task 12: Casca do app — navegação e tratamento de erro

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/components/nav.tsx`
- Create: `src/app/error.tsx`, `src/app/(app)/loading.tsx`
- Create: `src/components/ui/money.tsx`
- Modify: `src/app/globals.css`
- Move: `src/app/page.tsx` → `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `requireUser` (Tarefa 11), `signOut` (Tarefa 11), `formatBRL` (Tarefa 3)
- Produces:
  - `<Nav />` — barra lateral no desktop, barra inferior no celular
  - `<Money cents={number} />` — exibe um valor formatado, com cor opcional por sinal
  - layout `(app)` que exige sessão

- [ ] **Step 1: Criar o componente de dinheiro**

Criar `src/components/ui/money.tsx`:

```tsx
import { formatBRL } from '@/lib/money';

/**
 * Todo valor monetário na tela passa por aqui. Centraliza a formatação e
 * garante que negativo apareça em vermelho de forma consistente.
 */
export function Money({
  cents,
  colorBySign = false,
  className = '',
}: {
  cents: number;
  colorBySign?: boolean;
  className?: string;
}) {
  const cor = !colorBySign
    ? ''
    : cents < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return <span className={`tabular-nums ${cor} ${className}`}>{formatBRL(cents)}</span>;
}
```

- [ ] **Step 2: Criar a navegação**

Criar `src/components/nav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS = [
  { href: '/', label: 'Resumo', icone: '📊' },
  { href: '/transacoes', label: 'Lançamentos', icone: '📝' },
  { href: '/cartoes', label: 'Cartões', icone: '💳' },
  { href: '/orcamentos', label: 'Orçamentos', icone: '🎯' },
  { href: '/simulador', label: 'Simulador', icone: '🧮' },
  { href: '/categorias', label: 'Categorias', icone: '🏷️' },
];

export function Nav() {
  const atual = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white
                 md:inset-y-0 md:right-auto md:w-56 md:border-r md:border-t-0
                 dark:border-slate-800 dark:bg-slate-950"
    >
      <ul className="flex justify-around md:flex-col md:gap-1 md:p-3">
        {ITENS.map((item) => {
          const ativo = atual === item.href;
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-2 py-2.5 text-xs
                            md:flex-row md:gap-3 md:rounded-lg md:px-3 md:text-sm
                            ${
                              ativo
                                ? 'font-medium text-slate-900 md:bg-slate-100 dark:text-slate-100 dark:md:bg-slate-900'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
              >
                <span aria-hidden>{item.icone}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Criar o layout autenticado**

Mover `src/app/page.tsx` para `src/app/(app)/page.tsx` (o dashboard de verdade vem na Tarefa 18; por ora pode ser um placeholder simples com o título "Resumo").

Criar `src/app/(app)/layout.tsx`:

```tsx
import { requireUser } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import { Nav } from '@/components/nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Nav />

      <div className="md:pl-56">
        <header className="flex items-center justify-between gap-4 px-5 py-4">
          <span className="truncate text-sm text-slate-500 dark:text-slate-400">
            {user.email}
          </span>
          <form action={signOut}>
            <button className="text-sm text-slate-500 underline underline-offset-4 dark:text-slate-400">
              Sair
            </button>
          </form>
        </header>

        {/* pb-24 no celular para o conteúdo não ficar atrás da barra inferior */}
        <main className="px-5 pb-24 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar as telas de erro e carregamento**

Criar `src/app/error.tsx`:

```tsx
'use client';

/** Rede de segurança: erro inesperado nunca vira tela branca. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Algo deu errado
      </h1>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
        Não consegui carregar esta tela. Seus dados estão seguros — isso foi um
        problema aqui, não com o que você cadastrou.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
      >
        Tentar de novo
      </button>
    </main>
  );
}
```

Criar `src/app/(app)/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div className="space-y-3 py-10" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
```

- [ ] **Step 5: Ajustar o layout raiz**

Em `src/app/layout.tsx`, garantir `lang="pt-BR"` no `<html>` e um `<title>` em português. Manter a importação de `globals.css`.

- [ ] **Step 6: Verificar**

Run: `npm run dev`

Verificar:
1. Logado, a navegação aparece à esquerda no desktop
2. Estreitando a janela para menos de 768px, a navegação vira barra inferior e o conteúdo não fica escondido atrás dela
3. O item da página atual aparece destacado
4. "Sair" desloga e leva para `/login`

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: casca do app com navegacao responsiva e telas de erro"
```

---

### Task 13: Categorias — tradutores de linha e primeira tela CRUD

**Files:**
- Create: `src/queries/mappers.ts`
- Create: `src/queries/categories.ts`
- Create: `src/app/(app)/categorias/page.tsx`, `src/app/(app)/categorias/actions.ts`
- Test: `src/queries/mappers.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `createServerSupabase`, `requireUser`
- Produces:
  - as formas de linha `CategoryRow`, `CardRow`, `TransactionRow`, `BudgetRow`
  - `rowToCategory(row: CategoryRow): Category`, `rowToCard(row: CardRow): CreditCard`, `rowToTransaction(row: TransactionRow): Transaction`, `rowToBudget(row: BudgetRow): Budget`
  - `listCategories(): Promise<Category[]>`
  - Server Actions `createCategory`, `updateCategory`, `archiveCategory`

O banco fala `snake_case` e o domínio fala `camelCase`. Os tradutores ficam num arquivo só, testado, para essa conversão não se espalhar por toda a base.

- [ ] **Step 1: Escrever os testes dos tradutores**

Criar `src/queries/mappers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rowToCategory, rowToCard, rowToTransaction, rowToBudget } from './mappers';

describe('rowToCategory', () => {
  it('traduz snake_case do banco para o domínio', () => {
    expect(
      rowToCategory({
        id: 'c1', name: 'Supermercado', emoji: '🛒', color: '#10b981',
        type: 'expense', is_archived: false,
      }),
    ).toEqual({
      id: 'c1', name: 'Supermercado', emoji: '🛒', color: '#10b981',
      type: 'expense', isArchived: false,
    });
  });
});

describe('rowToCard', () => {
  it('traduz os dias do ciclo e o limite', () => {
    expect(
      rowToCard({
        id: 'k1', nickname: 'Nubank', brand: 'mastercard', limit_cents: 500000,
        closing_day: 20, due_day: 27, color: '#7c3aed',
      }),
    ).toEqual({
      id: 'k1', nickname: 'Nubank', brand: 'mastercard', limitCents: 500000,
      closingDay: 20, dueDay: 27, color: '#7c3aed',
    });
  });
});

describe('rowToTransaction', () => {
  it('traduz um lancamento simples', () => {
    expect(
      rowToTransaction({
        id: 't1', date: '2026-08-10', amount_cents: 12345, type: 'expense',
        category_id: 'c1', description: 'Padaria', payment_method: 'pix',
        credit_card_id: null, installment_plan_id: null, installment_number: null,
        is_recurring: false,
      }),
    ).toEqual({
      id: 't1', date: '2026-08-10', amountCents: 12345, type: 'expense',
      categoryId: 'c1', description: 'Padaria', paymentMethod: 'pix',
      creditCardId: null, installmentPlanId: null, installmentNumber: null,
      isRecurring: false,
    });
  });

  it('traduz uma parcela mantendo plano e numero', () => {
    const t = rowToTransaction({
      id: 't2', date: '2026-09-27', amount_cents: 30000, type: 'expense',
      category_id: 'c1', description: 'TV', payment_method: 'credit',
      credit_card_id: 'k1', installment_plan_id: 'p1', installment_number: 2,
      is_recurring: false,
    });

    expect(t.installmentPlanId).toBe('p1');
    expect(t.installmentNumber).toBe(2);
    expect(t.creditCardId).toBe('k1');
  });
});

describe('rowToBudget', () => {
  it('traduz o teto e o mes', () => {
    expect(
      rowToBudget({ id: 'b1', category_id: 'c1', month: '2026-08-01', limit_cents: 50000 }),
    ).toEqual({ id: 'b1', categoryId: 'c1', month: '2026-08-01', limitCents: 50000 });
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/queries/mappers.test.ts`
Expected: FAIL — `Failed to resolve import "./mappers"`.

- [ ] **Step 3: Implementar os tradutores**

Criar `src/queries/mappers.ts`:

```ts
import type {
  Budget,
  Category,
  CreditCard,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '@/lib/types';

/**
 * O banco fala snake_case, o domínio fala camelCase. A tradução acontece
 * só aqui — nenhum componente lê `amount_cents` direto.
 */

/**
 * Cada tradutor declara a forma exata da linha que aceita. Nada de `any`:
 * se um `select` esquecer uma coluna, o erro aparece na compilação, não em
 * produção com um campo `undefined` na tela.
 */
export interface CategoryRow {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: TransactionType;
  is_archived: boolean;
}

export interface CardRow {
  id: string;
  nickname: string;
  brand: string;
  limit_cents: number;
  closing_day: number;
  due_day: number;
  color: string;
}

export interface TransactionRow {
  id: string;
  date: string;
  amount_cents: number;
  type: TransactionType;
  category_id: string;
  description: string;
  payment_method: PaymentMethod;
  credit_card_id: string | null;
  installment_plan_id: string | null;
  installment_number: number | null;
  is_recurring: boolean;
}

export interface BudgetRow {
  id: string;
  category_id: string;
  month: string;
  limit_cents: number;
}

export function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    type: row.type,
    isArchived: row.is_archived,
  };
}

export function rowToCard(row: CardRow): CreditCard {
  return {
    id: row.id,
    nickname: row.nickname,
    brand: row.brand,
    limitCents: row.limit_cents,
    closingDay: row.closing_day,
    dueDay: row.due_day,
    color: row.color,
  };
}

export function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    amountCents: row.amount_cents,
    type: row.type,
    categoryId: row.category_id,
    description: row.description,
    paymentMethod: row.payment_method,
    creditCardId: row.credit_card_id,
    installmentPlanId: row.installment_plan_id,
    installmentNumber: row.installment_number,
    isRecurring: row.is_recurring,
  };
}

export function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    month: row.month,
    limitCents: row.limit_cents,
  };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/queries/mappers.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 5: Escrever as consultas de categoria**

Criar `src/queries/categories.ts`:

```ts
import { createServerSupabase } from '@/lib/supabase/server';
import { rowToCategory } from './mappers';
import type { Category } from '@/lib/types';

/** Categorias ativas do usuário logado, despesas primeiro, em ordem alfabética. */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, emoji, color, type, is_archived')
    .eq('is_archived', false)
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Não consegui carregar as categorias: ${error.message}`);
  return (data ?? []).map(rowToCategory);
}
```

- [ ] **Step 6: Escrever as Server Actions de categoria**

Criar `src/app/(app)/categorias/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';

const esquema = z.object({
  name: z.string().trim().min(1, 'Dê um nome para a categoria.').max(60),
  emoji: z.string().trim().max(8).default('📌'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor válida.'),
  type: z.enum(['income', 'expense']),
});

export type ActionState = { error: string | null };

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('categories')
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { error: 'Não consegui salvar a categoria. Tente de novo.' };

  revalidatePath('/categorias');
  return { error: null };
}

export async function updateCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const id = String(formData.get('id') ?? '');
  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!id) return { error: 'Categoria não encontrada.' };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('categories').update(parsed.data).eq('id', id);

  if (error) return { error: 'Não consegui salvar a alteração. Tente de novo.' };

  revalidatePath('/categorias');
  return { error: null };
}

/**
 * Categoria com lançamentos não é apagada, é arquivada — apagar quebraria o
 * histórico. O banco impede a exclusão com `on delete restrict`.
 */
export async function archiveCategory(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('categories').update({ is_archived: true }).eq('id', id);

  revalidatePath('/categorias');
}
```

- [ ] **Step 7: Criar a tela de categorias**

Criar `src/app/(app)/categorias/page.tsx`. Um Server Component que chama `listCategories()` e renderiza duas listas — Despesas e Receitas — cada linha mostrando `emoji`, `name`, uma bolinha com a `color`, e um botão "Arquivar" dentro de um `<form action={archiveCategory}>`. No topo, um formulário de criação com os campos `name`, `emoji`, `color` (input `type="color"`) e `type` (select), usando `useActionState` num Client Component filho.

Exigências desta tela:
- Título `<h1>Categorias</h1>` e um parágrafo explicando: "Estas são as caixinhas onde seus lançamentos são organizados. Você pode renomear, trocar a cor ou arquivar as que não usa."
- Categoria arquivada some da lista, mas os lançamentos antigos continuam intactos
- Mensagem de erro da action visível com `role="alert"`

- [ ] **Step 8: Verificar**

Run: `npm run dev`, abrir `/categorias`

Verificar:
1. As 32 categorias aparecem, separadas em Despesas (21) e Receitas (11)
2. Criar uma categoria nova — aparece na lista sem recarregar a página
3. Arquivar uma categoria — some da lista
4. Tentar criar com nome vazio — mostra a mensagem em português

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros de tipo.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: tela de categorias com tradutores de linha testados"
```

---

### Task 14: Cartões de crédito

**Files:**
- Create: `src/queries/cards.ts`
- Create: `src/app/(app)/cartoes/page.tsx`, `src/app/(app)/cartoes/actions.ts`
- Create: `src/components/cards/credit-card-tile.tsx`

**Interfaces:**
- Consumes: `rowToCard`, `createServerSupabase`, `requireUser`, `Money`
- Produces:
  - `listCards(): Promise<CreditCard[]>`
  - `getCard(id: string): Promise<CreditCard | null>`
  - Server Actions `createCard`, `updateCard`, `deleteCard`

- [ ] **Step 1: Escrever as consultas**

Criar `src/queries/cards.ts`:

```ts
import { createServerSupabase } from '@/lib/supabase/server';
import { rowToCard } from './mappers';
import type { CreditCard } from '@/lib/types';

const CAMPOS = 'id, nickname, brand, limit_cents, closing_day, due_day, color';

export async function listCards(): Promise<CreditCard[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('credit_cards')
    .select(CAMPOS)
    .order('nickname', { ascending: true });

  if (error) throw new Error(`Não consegui carregar os cartões: ${error.message}`);
  return (data ?? []).map(rowToCard);
}

export async function getCard(id: string): Promise<CreditCard | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('credit_cards')
    .select(CAMPOS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Não consegui carregar o cartão: ${error.message}`);
  return data ? rowToCard(data) : null;
}
```

- [ ] **Step 2: Escrever as Server Actions**

Criar `src/app/(app)/cartoes/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';
import { parseBRL } from '@/lib/money';

const esquema = z.object({
  nickname: z.string().trim().min(1, 'Dê um apelido para o cartão.').max(40),
  brand: z.string().trim().max(30).default(''),
  limit: z.string().default('0'),
  closing_day: z.coerce.number().int().min(1, 'O dia de fechamento vai de 1 a 31.').max(31),
  due_day: z.coerce.number().int().min(1, 'O dia de vencimento vai de 1 a 31.').max(31),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor válida.'),
});

export type ActionState = { error: string | null };

function toRow(dados: z.infer<typeof esquema>) {
  const { limit, ...resto } = dados;
  return { ...resto, limit_cents: parseBRL(limit) };
}

export async function createCard(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('credit_cards')
    .insert({ ...toRow(parsed.data), user_id: user.id });

  if (error) return { error: 'Não consegui salvar o cartão. Tente de novo.' };

  revalidatePath('/cartoes');
  return { error: null };
}

export async function updateCard(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const id = String(formData.get('id') ?? '');
  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!id) return { error: 'Cartão não encontrado.' };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('credit_cards').update(toRow(parsed.data)).eq('id', id);

  if (error) return { error: 'Não consegui salvar a alteração. Tente de novo.' };

  revalidatePath('/cartoes');
  return { error: null };
}

/** Apagar o cartão apaga junto as compras parceladas dele (cascade no banco). */
export async function deleteCard(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('credit_cards').delete().eq('id', id);

  revalidatePath('/cartoes');
  revalidatePath('/transacoes');
}
```

- [ ] **Step 3: Criar o componente de cartão**

Criar `src/components/cards/credit-card-tile.tsx`. Um Server Component que recebe `card: CreditCard`, `currentInvoiceCents: number`, `nextInvoiceCents: number` e renderiza um retângulo arredondado com a cor do cartão ao fundo, mostrando:

- apelido e bandeira
- "Fatura atual" com `<Money />`
- "Próxima fatura" com `<Money />`
- rodapé: "Fecha dia {closingDay} · vence dia {dueDay}"
- se `limitCents > 0`, uma barra fina com a fração `currentInvoiceCents / limitCents` e o texto "Disponível: {limite − fatura atual}"

O tile inteiro é um `<Link href={'/cartoes/' + card.id}>`.

- [ ] **Step 4: Criar a tela de cartões**

Criar `src/app/(app)/cartoes/page.tsx`: Server Component que chama `listCards()` e, para cada cartão, calcula as duas faturas (a consulta vem na Tarefa 16 — por ora passar `0` e `0`, que a Tarefa 16 substitui).

Estado vazio: quando não há nenhum cartão, mostrar "Você ainda não cadastrou nenhum cartão. Cadastre um para lançar compras parceladas e ver suas faturas." com o formulário logo abaixo.

Formulário de criação com os campos do esquema, e uma frase de ajuda embaixo dos dias: "O dia de fechamento é quando a fatura para de aceitar compras novas; o de vencimento é quando você paga. Os dois vêm no seu extrato ou no app do banco."

- [ ] **Step 5: Verificar**

Run: `npm run dev`, abrir `/cartoes`

Verificar:
1. Sem cartões, o estado vazio aparece com a explicação
2. Cadastrar um cartão (fechamento 20, vencimento 27) — o tile aparece
3. Tentar cadastrar com dia 35 — mostra "O dia de fechamento vai de 1 a 31."
4. Editar o apelido — persiste após recarregar

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: cadastro de cartoes de credito com ciclo de fatura"
```

---

### Task 15: Lançamentos — consultas, listagem e filtros

**Files:**
- Create: `src/queries/transactions.ts`
- Create: `src/app/(app)/transacoes/page.tsx`
- Create: `src/components/transactions/transaction-list.tsx`
- Create: `src/components/transactions/filters.tsx`
- Create: `src/lib/month.ts`
- Test: `src/lib/month.test.ts`

**Interfaces:**
- Consumes: `rowToTransaction`, `Money`, `Category`
- Produces:
  - `monthRange(monthISO: string): { start: string; end: string }`
  - `currentMonthISO(today?: string): string`
  - `shiftMonth(monthISO: string, delta: number): string`
  - `interface TransactionFilters { month?: string; type?: TransactionType; categoryId?: string; search?: string }`
  - `listTransactions(filters: TransactionFilters): Promise<Transaction[]>`
  - `listTransactionsBetween(startISO: string, endISO: string): Promise<Transaction[]>`

- [ ] **Step 1: Escrever os testes do módulo de mês**

Criar `src/lib/month.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { monthRange, currentMonthISO, shiftMonth, monthLabel } from './month';

describe('monthRange', () => {
  it('vai do dia 1 ao ultimo dia do mes', () => {
    expect(monthRange('2026-08-01')).toEqual({ start: '2026-08-01', end: '2026-08-31' });
  });

  it('respeita fevereiro em ano comum', () => {
    expect(monthRange('2026-02-01')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('respeita fevereiro em ano bissexto', () => {
    expect(monthRange('2028-02-01')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });
});

describe('currentMonthISO', () => {
  it('normaliza qualquer data para o dia 1 do mes', () => {
    expect(currentMonthISO('2026-08-17')).toBe('2026-08-01');
  });
});

describe('shiftMonth', () => {
  it('avanca um mes', () => {
    expect(shiftMonth('2026-08-01', 1)).toBe('2026-09-01');
  });

  it('volta um mes', () => {
    expect(shiftMonth('2026-08-01', -1)).toBe('2026-07-01');
  });

  it('vira o ano para frente', () => {
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('vira o ano para tras', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
  });
});

describe('monthLabel', () => {
  it('escreve o mes por extenso em portugues', () => {
    expect(monthLabel('2026-08-01')).toBe('agosto de 2026');
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/month.test.ts`
Expected: FAIL — `Failed to resolve import "./month"`.

- [ ] **Step 3: Implementar o módulo de mês**

Criar `src/lib/month.ts`:

```ts
import { lastDayOfMonth } from './billing-cycle';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Primeiro e último dia do mês, em ISO. */
export function monthRange(monthISO: string): { start: string; end: string } {
  const [year, month] = monthISO.split('-').map(Number);
  const ultimo = String(lastDayOfMonth(year, month)).padStart(2, '0');
  const mm = String(month).padStart(2, '0');

  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${ultimo}` };
}

/** Normaliza uma data qualquer para o dia 1 do seu mês. */
export function currentMonthISO(today: string = new Date().toISOString().slice(0, 10)): string {
  return `${today.slice(0, 7)}-01`;
}

/** Anda `delta` meses, virando o ano quando precisa. */
export function shiftMonth(monthISO: string, delta: number): string {
  const [year, month] = monthISO.split('-').map(Number);
  const zeroBased = month - 1 + delta;
  const novoAno = year + Math.floor(zeroBased / 12);
  const novoMes = (((zeroBased % 12) + 12) % 12) + 1;

  return `${novoAno}-${String(novoMes).padStart(2, '0')}-01`;
}

/** "2026-08-01" → "agosto de 2026". */
export function monthLabel(monthISO: string): string {
  const [year, month] = monthISO.split('-').map(Number);
  return `${MESES[month - 1]} de ${year}`;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/month.test.ts`
Expected: PASS — 10 testes.

- [ ] **Step 5: Escrever as consultas de lançamento**

Criar `src/queries/transactions.ts`:

```ts
import { createServerSupabase } from '@/lib/supabase/server';
import { rowToTransaction } from './mappers';
import { monthRange } from '@/lib/month';
import type { Transaction, TransactionType } from '@/lib/types';

const CAMPOS =
  'id, date, amount_cents, type, category_id, description, payment_method, ' +
  'credit_card_id, installment_plan_id, installment_number, is_recurring';

export interface TransactionFilters {
  /** Dia 1 do mês, ISO. Ausente = todos os meses. */
  month?: string;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
}

/** Lançamentos do usuário logado, mais recentes primeiro. */
export async function listTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const supabase = await createServerSupabase();

  let query = supabase.from('transactions').select(CAMPOS);

  if (filters.month) {
    const { start, end } = monthRange(filters.month);
    query = query.gte('date', start).lte('date', end);
  }
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.search) query = query.ilike('description', `%${filters.search}%`);

  const { data, error } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Não consegui carregar os lançamentos: ${error.message}`);
  return (data ?? []).map(rowToTransaction);
}

/** Intervalo arbitrário — usado pelo dashboard e pelas faturas. */
export async function listTransactionsBetween(
  startISO: string,
  endISO: string,
): Promise<Transaction[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('transactions')
    .select(CAMPOS)
    .gte('date', startISO)
    .lte('date', endISO)
    .order('date', { ascending: true });

  if (error) throw new Error(`Não consegui carregar os lançamentos: ${error.message}`);
  return (data ?? []).map(rowToTransaction);
}
```

- [ ] **Step 6: Criar os filtros**

Criar `src/components/transactions/filters.tsx`. Client Component que lê e escreve `searchParams` com `useRouter` e `useSearchParams`. Renderiza uma linha rolável horizontalmente de "pílulas":

- navegação de mês: `‹ {monthLabel(mes)} ›` usando `shiftMonth`
- "Tudo" / "Receitas" / "Despesas" (parâmetro `tipo`)
- select de categoria (parâmetro `categoria`)
- campo de busca com `debounce` de 300ms (parâmetro `busca`)

Pílula ativa fica com fundo escuro e texto claro. A faixa usa `overflow-x-auto` e não estoura a largura da tela no celular.

- [ ] **Step 7: Criar a lista**

Criar `src/components/transactions/transaction-list.tsx`. Recebe `transactions`, `categories` e `cards`. Para cada lançamento, uma linha com:

- emoji e nome da categoria
- descrição (ou o nome da categoria, se vazia)
- se for parcela: a etiqueta `{installmentNumber}/{total} · {apelido do cartão}` em texto menor
- data formatada `dd/mm`
- `<Money cents={type === 'income' ? amount : -amount} colorBySign />`
- botões "Editar" e "Excluir"

Estado vazio: "Nenhum lançamento com esses filtros. Tente mudar o mês ou limpar os filtros."

Agrupar por dia com um cabeçalho de data quando houver mais de um dia na lista.

- [ ] **Step 8: Criar a página**

Criar `src/app/(app)/transacoes/page.tsx`. Server Component que lê `searchParams`, chama `listTransactions` e `listCategories` e `listCards`, e renderiza `<Filters />` + `<TransactionList />`. Mês padrão é `currentMonthISO()`.

No topo, o total do período filtrado: "Receitas X · Despesas Y · Saldo Z".

- [ ] **Step 9: Verificar**

Inserir três lançamentos de teste direto pelo banco (ou pela tela da Tarefa 16, se já existir) e verificar em `/transacoes`:

1. Os lançamentos do mês atual aparecem
2. Filtrar por "Despesas" esconde as receitas
3. Navegar para o mês anterior mostra a lista vazia com a mensagem certa
4. A busca por texto filtra pela descrição
5. No celular (janela < 768px), a faixa de filtros rola horizontalmente sem estourar a tela

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: listagem de lancamentos com filtros por mes, tipo e busca"
```

---

### Task 16: Formulário de lançamento e geração de parcelas

**Files:**
- Create: `src/components/ui/money-input.tsx`
- Create: `src/components/transactions/transaction-form.tsx`
- Create: `src/app/(app)/transacoes/actions.ts`
- Modify: `src/app/(app)/transacoes/page.tsx`

**Interfaces:**
- Consumes: `generateInstallments` (Tarefa 5), `parseBRL`/`formatBRLCompact` (Tarefa 3), `getCard` (Tarefa 14)
- Produces: Server Actions `createTransaction`, `updateTransaction`, `deleteTransaction`, `deleteInstallmentPlan`

Esta é a tarefa onde a regra do regime de caixa por parcela vira código. Uma compra de R$ 3.000 em 10x não grava um lançamento de R$ 3.000: grava um `installment_plan` e **dez** transações de R$ 300, cada uma datada no vencimento da sua fatura.

- [ ] **Step 1: Criar o campo de dinheiro**

Criar `src/components/ui/money-input.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { formatBRLCompact, parseBRL } from '@/lib/money';

/**
 * Campo que só aceita formato brasileiro. Reformata a cada tecla, então o
 * texto enviado ao servidor é sempre o que `parseBRL` sabe ler.
 */
export function MoneyInput({
  name,
  defaultCents = 0,
  required = true,
  id,
}: {
  name: string;
  defaultCents?: number;
  required?: boolean;
  id?: string;
}) {
  const [texto, setTexto] = useState(defaultCents ? formatBRLCompact(defaultCents) : '');

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        R$
      </span>
      <input
        id={id}
        name={name}
        required={required}
        inputMode="decimal"
        value={texto}
        onChange={(e) => setTexto(formatBRLCompact(parseBRL(e.target.value)))}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-right tabular-nums
                   dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}
```

- [ ] **Step 2: Escrever as Server Actions**

Criar `src/app/(app)/transacoes/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';
import { parseBRL } from '@/lib/money';
import { generateInstallments } from '@/lib/installments';
import { getCard } from '@/queries/cards';

const esquema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha uma data válida.'),
  amount: z.string(),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid('Escolha uma categoria.'),
  description: z.string().trim().max(120).default(''),
  payment_method: z.enum(['pix', 'debit', 'cash', 'credit']),
  credit_card_id: z.string().uuid().optional().or(z.literal('')),
  installments_count: z.coerce.number().int().min(1).max(60).default(1),
  is_recurring: z.coerce.boolean().default(false),
});

export type ActionState = { error: string | null };

function revalidarTudo() {
  revalidatePath('/');
  revalidatePath('/transacoes');
  revalidatePath('/cartoes');
  revalidatePath('/orcamentos');
}

export async function createTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const totalCents = parseBRL(d.amount);
  if (totalCents <= 0) return { error: 'O valor precisa ser maior que zero.' };

  const noCredito = d.payment_method === 'credit';
  const cartaoId = d.credit_card_id || null;

  if (noCredito && !cartaoId) {
    return { error: 'Escolha em qual cartão essa compra foi feita.' };
  }
  if (d.installments_count > 1 && !noCredito) {
    return { error: 'Só dá para parcelar compras no crédito.' };
  }

  const supabase = await createServerSupabase();

  // Lançamento simples: uma linha e pronto.
  if (d.installments_count === 1) {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      date: d.date,
      amount_cents: totalCents,
      type: d.type,
      category_id: d.category_id,
      description: d.description,
      payment_method: d.payment_method,
      credit_card_id: cartaoId,
      is_recurring: d.is_recurring,
    });

    if (error) return { error: 'Não consegui salvar o lançamento. Tente de novo.' };

    revalidarTudo();
    return { error: null };
  }

  // Compra parcelada: precisa do ciclo do cartão para datar cada parcela.
  const cartao = await getCard(cartaoId!);
  if (!cartao) return { error: 'Cartão não encontrado.' };

  const { data: plano, error: erroPlano } = await supabase
    .from('installment_plans')
    .insert({
      user_id: user.id,
      description: d.description,
      total_cents: totalCents,
      installments_count: d.installments_count,
      purchase_date: d.date,
      credit_card_id: cartao.id,
      category_id: d.category_id,
    })
    .select('id')
    .single();

  if (erroPlano || !plano) {
    return { error: 'Não consegui salvar a compra parcelada. Tente de novo.' };
  }

  const parcelas = generateInstallments({
    totalCents,
    count: d.installments_count,
    purchaseDate: d.date,
    closingDay: cartao.closingDay,
    dueDay: cartao.dueDay,
  });

  const { error: erroParcelas } = await supabase.from('transactions').insert(
    parcelas.map((p) => ({
      user_id: user.id,
      date: p.dueDate,
      amount_cents: p.amountCents,
      type: d.type,
      category_id: d.category_id,
      description: d.description,
      payment_method: 'credit' as const,
      credit_card_id: cartao.id,
      installment_plan_id: plano.id,
      installment_number: p.number,
      is_recurring: false,
    })),
  );

  if (erroParcelas) {
    // Não deixa um plano órfão sem parcelas no banco.
    await supabase.from('installment_plans').delete().eq('id', plano.id);
    return { error: 'Não consegui gerar as parcelas. Tente de novo.' };
  }

  revalidarTudo();
  return { error: null };
}

/** Editar uma parcela isolada muda só ela. Para mexer na compra toda, apague e refaça. */
export async function updateTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const id = String(formData.get('id') ?? '');
  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!id) return { error: 'Lançamento não encontrado.' };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const amountCents = parseBRL(d.amount);
  if (amountCents <= 0) return { error: 'O valor precisa ser maior que zero.' };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('transactions')
    .update({
      date: d.date,
      amount_cents: amountCents,
      type: d.type,
      category_id: d.category_id,
      description: d.description,
      payment_method: d.payment_method,
      credit_card_id: d.credit_card_id || null,
      is_recurring: d.is_recurring,
    })
    .eq('id', id);

  if (error) return { error: 'Não consegui salvar a alteração. Tente de novo.' };

  revalidarTudo();
  return { error: null };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('transactions').delete().eq('id', id);

  revalidarTudo();
}

/** Apaga a compra-mãe e, por cascade, todas as parcelas dela de uma vez. */
export async function deleteInstallmentPlan(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('installment_plan_id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('installment_plans').delete().eq('id', id);

  revalidarTudo();
}
```

- [ ] **Step 3: Criar o formulário**

Criar `src/components/transactions/transaction-form.tsx`. Client Component num painel lateral (`<dialog>` ou um `div` fixo com sobreposição), aberto pelo botão flutuante `+`. Campos, nesta ordem:

1. Tipo: dois botões grandes, "Despesa" e "Receita" (despesa pré-selecionada)
2. Valor: `<MoneyInput name="amount" />`
3. Data: `<input type="date" name="date">`, padrão hoje
4. Categoria: select filtrado pelo tipo escolhido
5. Forma de pagamento: quatro botões — PIX, Débito, Dinheiro, Crédito
6. **Só quando "Crédito" está escolhido:** select de cartão e campo "Parcelas" (1 a 24)
7. Descrição
8. "Repete todo mês" (checkbox, some quando há mais de uma parcela)

**A prévia das parcelas** é o que impede o susto: quando `parcelas > 1` e um cartão está escolhido, o formulário chama `generateInstallments` no próprio navegador (o módulo é puro, roda nos dois lados) e mostra, abaixo do campo:

> 10x de R$ 300,00 — primeira em 27/08/2026, última em 27/05/2027

Se o arredondamento fizer a primeira parcela diferente, mostrar: *"a primeira sai R$ 33,34 e as outras R$ 33,33"*.

Erro da action visível com `role="alert"`. O painel fecha ao salvar com sucesso.

- [ ] **Step 4: Ligar o formulário à página**

Modificar `src/app/(app)/transacoes/page.tsx` para renderizar o botão flutuante e o `<TransactionForm />`, passando `categories` e `cards`. Ligar "Editar" de cada linha ao mesmo formulário em modo edição.

Em uma linha que é parcela, o botão "Excluir" pergunta o que apagar: **só esta parcela** (`deleteTransaction`) ou **a compra inteira** (`deleteInstallmentPlan`). Não escolher por conta própria — as duas intenções são legítimas.

- [ ] **Step 5: Verificar o caminho crítico**

Run: `npm run dev`

Com um cartão que fecha dia 20 e vence dia 27 cadastrado:

1. Lançar "TV, R$ 3.000, 10x, crédito, cartão X, data 05/08/2026"
2. Conferir a prévia: **10x de R$ 300,00, primeira em 27/08/2026**
3. Salvar e conferir em `/transacoes` que **agosto mostra R$ 300, não R$ 3.000**
4. Navegar para setembro — a parcela 2/10 aparece
5. Conferir no banco: 10 linhas em `transactions` com o mesmo `installment_plan_id`, e a soma delas igual a 300000 centavos
6. Lançar "R$ 100, 3x" e conferir que as parcelas são 33,34 + 33,33 + 33,33
7. Repetir o lançamento da TV com data 21/08/2026 e conferir que a primeira parcela agora vence em **27/09/2026**
8. Excluir "a compra inteira" — as 10 parcelas somem juntas
9. Tentar salvar com valor zero — mostra "O valor precisa ser maior que zero."
10. Escolher "Crédito" sem escolher cartão — mostra "Escolha em qual cartão essa compra foi feita."

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: lancamento com parcelamento gerando as parcelas nas faturas certas"
```

---

### Task 17: Faturas do cartão

**Files:**
- Create: `src/lib/invoices.ts`
- Test: `src/lib/invoices.test.ts`
- Create: `src/app/(app)/cartoes/[id]/page.tsx`
- Modify: `src/app/(app)/cartoes/page.tsx`, `src/components/cards/credit-card-tile.tsx`

**Interfaces:**
- Consumes: `Transaction`, `listTransactionsBetween`, `listCards`, `getCard`
- Produces:
  - `interface Invoice { dueDate: string; totalCents: number; transactions: Transaction[] }`
  - `groupIntoInvoices(transactions: Transaction[]): Invoice[]`
  - `currentAndNext(invoices: Invoice[], todayISO: string): { current: Invoice | null; next: Invoice | null }`

Como toda transação de crédito já é datada no vencimento da sua fatura (Tarefa 16), agrupar por `date` **é** agrupar por fatura. Nenhum recálculo de ciclo é necessário aqui.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/invoices.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { groupIntoInvoices, currentAndNext } from './invoices';
import type { Transaction } from './types';

function tx(date: string, amountCents: number): Transaction {
  return {
    id: `${date}-${amountCents}`,
    date,
    amountCents,
    type: 'expense',
    categoryId: 'c1',
    description: '',
    paymentMethod: 'credit',
    creditCardId: 'k1',
    installmentPlanId: null,
    installmentNumber: null,
    isRecurring: false,
  };
}

describe('groupIntoInvoices', () => {
  it('junta lancamentos com o mesmo vencimento numa fatura so', () => {
    const faturas = groupIntoInvoices([
      tx('2026-08-27', 10000),
      tx('2026-08-27', 5000),
      tx('2026-09-27', 30000),
    ]);

    expect(faturas).toHaveLength(2);
    expect(faturas[0].dueDate).toBe('2026-08-27');
    expect(faturas[0].totalCents).toBe(15000);
    expect(faturas[0].transactions).toHaveLength(2);
    expect(faturas[1].totalCents).toBe(30000);
  });

  it('devolve as faturas em ordem de vencimento', () => {
    const faturas = groupIntoInvoices([
      tx('2026-10-27', 100),
      tx('2026-08-27', 100),
      tx('2026-09-27', 100),
    ]);

    expect(faturas.map((f) => f.dueDate)).toEqual([
      '2026-08-27', '2026-09-27', '2026-10-27',
    ]);
  });

  it('lista vazia nao gera fatura', () => {
    expect(groupIntoInvoices([])).toEqual([]);
  });
});

describe('currentAndNext', () => {
  const faturas = groupIntoInvoices([
    tx('2026-07-27', 10000),
    tx('2026-08-27', 20000),
    tx('2026-09-27', 30000),
  ]);

  it('a atual e a primeira que ainda nao venceu', () => {
    const { current, next } = currentAndNext(faturas, '2026-08-10');
    expect(current?.dueDate).toBe('2026-08-27');
    expect(next?.dueDate).toBe('2026-09-27');
  });

  it('a fatura que vence hoje ainda e a atual', () => {
    const { current } = currentAndNext(faturas, '2026-08-27');
    expect(current?.dueDate).toBe('2026-08-27');
  });

  it('sem fatura futura, atual e proxima sao nulas', () => {
    const { current, next } = currentAndNext(faturas, '2026-12-01');
    expect(current).toBeNull();
    expect(next).toBeNull();
  });

  it('sem faturas nenhuma, devolve nulos', () => {
    const { current, next } = currentAndNext([], '2026-08-10');
    expect(current).toBeNull();
    expect(next).toBeNull();
  });

  it('havendo uma unica fatura futura, a proxima e nula', () => {
    const { current, next } = currentAndNext(faturas, '2026-09-01');
    expect(current?.dueDate).toBe('2026-09-27');
    expect(next).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

Run: `npx vitest run src/lib/invoices.test.ts`
Expected: FAIL — `Failed to resolve import "./invoices"`.

- [ ] **Step 3: Implementar**

Criar `src/lib/invoices.ts`:

```ts
import type { Transaction } from './types';

export interface Invoice {
  /** ISO 'YYYY-MM-DD' — quando esta fatura vence. */
  dueDate: string;
  totalCents: number;
  transactions: Transaction[];
}

/**
 * Agrupa lançamentos de cartão em faturas.
 * Como cada parcela já nasce datada no vencimento da sua fatura, agrupar por
 * data é agrupar por fatura — não há ciclo a recalcular aqui.
 */
export function groupIntoInvoices(transactions: Transaction[]): Invoice[] {
  const porVencimento = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const lista = porVencimento.get(t.date) ?? [];
    lista.push(t);
    porVencimento.set(t.date, lista);
  }

  return [...porVencimento.entries()]
    .map(([dueDate, lista]) => ({
      dueDate,
      totalCents: lista.reduce((total, t) => total + t.amountCents, 0),
      transactions: lista,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * A fatura atual é a primeira que ainda não venceu (vencer hoje ainda conta).
 * A próxima é a seguinte a ela.
 */
export function currentAndNext(
  invoices: Invoice[],
  todayISO: string,
): { current: Invoice | null; next: Invoice | null } {
  const futuras = invoices.filter((f) => f.dueDate >= todayISO);

  return {
    current: futuras[0] ?? null,
    next: futuras[1] ?? null,
  };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/invoices.test.ts`
Expected: PASS — 8 testes.

- [ ] **Step 5: Ligar as faturas à tela de cartões**

Modificar `src/app/(app)/cartoes/page.tsx`: para cada cartão, buscar os lançamentos de crédito daquele cartão com `listTransactionsBetween` (de hoje até 24 meses à frente), passar por `groupIntoInvoices` e `currentAndNext`, e alimentar `currentInvoiceCents` e `nextInvoiceCents` do tile — substituindo os zeros deixados na Tarefa 14.

- [ ] **Step 6: Criar a fatura detalhada**

Criar `src/app/(app)/cartoes/[id]/page.tsx`. Server Component que:

- carrega o cartão com `getCard`; se não existir, `notFound()`
- lista todas as faturas futuras do cartão
- destaca a fatura atual: total grande, "vence em dd/mm", e a lista dos lançamentos dela (descrição, categoria, etiqueta `k/n` quando parcela, valor)
- abaixo, as faturas seguintes em forma compacta: vencimento e total
- estado vazio: "Este cartão ainda não tem lançamentos."

- [ ] **Step 7: Verificar**

Com a compra "TV, R$ 3.000, 10x" feita na Tarefa 16:

1. `/cartoes` mostra a fatura atual do cartão com R$ 300,00
2. Clicar no cartão abre a fatura detalhada com o lançamento "TV 1/10"
3. As nove faturas seguintes aparecem listadas, cada uma com R$ 300,00
4. A soma de todas as faturas é R$ 3.000,00

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: faturas do cartao com detalhe dos lancamentos"
```

---

### Task 18: Orçamentos com barras coloridas

**Files:**
- Create: `src/queries/budgets.ts`
- Create: `src/app/(app)/orcamentos/page.tsx`, `src/app/(app)/orcamentos/actions.ts`
- Create: `src/components/budgets/budget-row.tsx`

**Interfaces:**
- Consumes: `budgetColor` (Tarefa 8), `rowToBudget`, `listCategories`, `monthRange`, `shiftMonth`, `monthLabel`
- Produces:
  - `listBudgetStatus(monthISO: string): Promise<BudgetStatus[]>`
  - Server Actions `setBudget`, `copyBudgetsFromPreviousMonth`

- [ ] **Step 1: Escrever a consulta**

Criar `src/queries/budgets.ts`:

```ts
import { createServerSupabase } from '@/lib/supabase/server';
import { monthRange } from '@/lib/month';
import { listCategories } from './categories';
import type { BudgetStatus } from '@/lib/types';

/**
 * Para cada categoria de despesa: o teto do mês (se houver) e o quanto já foi
 * gasto. Teto ausente vem como null — não é o mesmo que teto zero.
 */
export async function listBudgetStatus(monthISO: string): Promise<BudgetStatus[]> {
  const supabase = await createServerSupabase();
  const { start, end } = monthRange(monthISO);

  const [categorias, tetos, gastos] = await Promise.all([
    listCategories(),
    supabase.from('budgets').select('category_id, limit_cents').eq('month', start),
    supabase
      .from('transactions')
      .select('category_id, amount_cents')
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end),
  ]);

  if (tetos.error) throw new Error(`Não consegui carregar os orçamentos: ${tetos.error.message}`);
  if (gastos.error) throw new Error(`Não consegui carregar os gastos: ${gastos.error.message}`);

  const tetoPor = new Map<string, number>(
    (tetos.data ?? []).map((t) => [t.category_id, t.limit_cents]),
  );

  const gastoPor = new Map<string, number>();
  for (const g of gastos.data ?? []) {
    gastoPor.set(g.category_id, (gastoPor.get(g.category_id) ?? 0) + g.amount_cents);
  }

  return categorias
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryEmoji: c.emoji,
      limitCents: tetoPor.get(c.id) ?? null,
      spentCents: gastoPor.get(c.id) ?? 0,
    }));
}
```

- [ ] **Step 2: Escrever as Server Actions**

Criar `src/app/(app)/orcamentos/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';
import { parseBRL } from '@/lib/money';
import { shiftMonth } from '@/lib/month';

const esquema = z.object({
  category_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Mês inválido.'),
  limit: z.string(),
});

export type ActionState = { error: string | null };

/**
 * Define ou atualiza o teto de uma categoria no mês.
 * Teto zerado apaga a linha: voltar a "sem orçamento" precisa ser possível,
 * e é diferente de um teto de R$ 0,00.
 */
export async function setBudget(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { category_id, month, limit } = parsed.data;
  const limitCents = parseBRL(limit);
  const supabase = await createServerSupabase();

  if (limitCents <= 0) {
    await supabase.from('budgets').delete().eq('category_id', category_id).eq('month', month);
  } else {
    const { error } = await supabase
      .from('budgets')
      .upsert(
        { user_id: user.id, category_id, month, limit_cents: limitCents },
        { onConflict: 'user_id,category_id,month' },
      );

    if (error) return { error: 'Não consegui salvar o orçamento. Tente de novo.' };
  }

  revalidatePath('/orcamentos');
  revalidatePath('/');
  return { error: null };
}

/** Copia os tetos do mês anterior. Não sobrescreve o que já foi definido. */
export async function copyBudgetsFromPreviousMonth(formData: FormData): Promise<void> {
  const user = await requireUser();
  const month = String(formData.get('month') ?? '');
  if (!/^\d{4}-\d{2}-01$/.test(month)) return;

  const anterior = shiftMonth(month, -1);
  const supabase = await createServerSupabase();

  const [origem, destino] = await Promise.all([
    supabase.from('budgets').select('category_id, limit_cents').eq('month', anterior),
    supabase.from('budgets').select('category_id').eq('month', month),
  ]);

  const jaDefinidos = new Set((destino.data ?? []).map((b) => b.category_id));
  const novos = (origem.data ?? [])
    .filter((b) => !jaDefinidos.has(b.category_id))
    .map((b) => ({
      user_id: user.id,
      category_id: b.category_id,
      month,
      limit_cents: b.limit_cents,
    }));

  if (novos.length > 0) await supabase.from('budgets').insert(novos);

  revalidatePath('/orcamentos');
  revalidatePath('/');
}
```

- [ ] **Step 3: Criar a linha de orçamento**

Criar `src/components/budgets/budget-row.tsx`. Client Component que recebe um `BudgetStatus` e o `month`. Renderiza:

- emoji + nome da categoria
- `<MoneyInput name="limit" defaultCents={limitCents ?? 0} required={false} />` que salva no `onBlur` via `setBudget`
- gasto e teto: `R$ 400,00 de R$ 500,00`
- barra de progresso quando `limitCents !== null`, largura `min(spent/limit, 1) * 100%`, cor vinda de `budgetColor`:
  - `green` → `bg-emerald-500`
  - `yellow` → `bg-amber-500`
  - `red` → `bg-red-500`
- quando `budgetColor` devolve `'none'`, **não renderizar barra nenhuma** — só o valor gasto em texto cinza, com a dica "sem teto definido"
- quando estourado, o texto "R$ 120,00 acima do teto" em vermelho
- `role="progressbar"` com `aria-valuenow`, `aria-valuemin={0}` e `aria-valuemax={100}`

- [ ] **Step 4: Criar a tela**

Criar `src/app/(app)/orcamentos/page.tsx`. Server Component com:

- navegação de mês igual à de `/transacoes` (`‹ agosto de 2026 ›`)
- parágrafo de abertura: "Defina quanto você quer gastar em cada categoria. A barra enche conforme você lança as despesas do mês."
- botão "Copiar do mês anterior" num `<form action={copyBudgetsFromPreviousMonth}>` com o `month` num input escondido
- resumo no topo: total orçado, total gasto, e quanto sobra
- categorias com teto definido primeiro, depois as sem teto

- [ ] **Step 5: Verificar os limites de cor**

Run: `npm run dev`, abrir `/orcamentos`

Com uma categoria de teto R$ 500,00, lançar despesas e conferir cada limite:

1. R$ 0,00 gastos → sem barra colorida de alerta, barra verde vazia
2. R$ 349,99 → **verde**
3. R$ 350,00 (exatamente 70%) → **amarelo**
4. R$ 499,99 → **amarelo**
5. R$ 500,00 (exatamente 100%) → **vermelho**
6. R$ 620,00 → **vermelho** com "R$ 120,00 acima do teto"
7. Categoria sem teto → sem barra, texto "sem teto definido"
8. Apagar o teto (deixar o campo em branco) → volta para "sem teto definido"
9. "Copiar do mês anterior" traz os tetos e não sobrescreve os já preenchidos

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: orcamentos por categoria com barras verde, amarela e vermelha"
```

---

### Task 19: Dashboard

**Files:**
- Create: `src/queries/dashboard.ts`
- Create: `src/components/dashboard/summary-cards.tsx`
- Create: `src/components/dashboard/insights-bar.tsx`
- Create: `src/components/dashboard/category-pie.tsx`
- Create: `src/components/dashboard/balance-line.tsx`
- Create: `src/components/ui/explain.tsx`
- Modify: `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `balanceOf`, `pendingRecurring`, `forecastEndOfMonth`, `committedFutureCents` (Tarefa 7), `buildInsights` (Tarefa 8), `listBudgetStatus` (Tarefa 18), `listTransactionsBetween`, `listCategories`, `monthRange`, `shiftMonth`, `lastDayOfMonth`
- Produces:
  - `interface DashboardData { monthISO; incomeCents; expenseCents; balanceCents; forecastCents; committedCents; insights; byCategory; monthlyBalances }`
  - `getDashboardData(monthISO: string, todayISO: string): Promise<DashboardData>`

**Antes de escrever qualquer código de gráfico:** carregar a skill `dataviz`. Ela define a paleta, os limites de acessibilidade e as regras de eixo/legenda que os dois gráficos devem seguir, em tema claro e escuro.

- [ ] **Step 1: Escrever a consulta do dashboard**

Criar `src/queries/dashboard.ts`:

```ts
import { listTransactionsBetween } from './transactions';
import { listCategories } from './categories';
import { listBudgetStatus } from './budgets';
import { monthRange, shiftMonth } from '@/lib/month';
import { lastDayOfMonth } from '@/lib/billing-cycle';
import {
  balanceOf,
  pendingRecurring,
  forecastEndOfMonth,
  committedFutureCents,
} from '@/lib/forecast';
import { buildInsights, type Insight } from '@/lib/insights';

export interface CategorySlice {
  categoryId: string;
  label: string;
  color: string;
  valueCents: number;
}

export interface MonthlyBalance {
  monthISO: string;
  balanceCents: number;
}

export interface DashboardData {
  monthISO: string;
  incomeCents: number;
  expenseCents: number;
  /** Receitas menos despesas com data até hoje. */
  balanceCents: number;
  forecastCents: number;
  /** Parcelas que vencem depois do fim deste mês. */
  committedCents: number;
  insights: Insight[];
  byCategory: CategorySlice[];
  monthlyBalances: MonthlyBalance[];
}

/** Monta tudo que o dashboard mostra, em uma ida só ao banco por conjunto. */
export async function getDashboardData(
  monthISO: string,
  todayISO: string,
): Promise<DashboardData> {
  const { start, end } = monthRange(monthISO);
  const mesAnterior = monthRange(shiftMonth(monthISO, -1));
  const inicioDaJanela = monthRange(shiftMonth(monthISO, -11)).start;

  const [doMes, doAnterior, futurasParcelas, categorias, orcamentos, janela12] =
    await Promise.all([
      listTransactionsBetween(start, end),
      listTransactionsBetween(mesAnterior.start, mesAnterior.end),
      // 5 anos à frente cobre qualquer parcelamento (o banco limita a 60x).
      listTransactionsBetween(start, `${Number(start.slice(0, 4)) + 5}-12-31`),
      listCategories(),
      listBudgetStatus(monthISO),
      listTransactionsBetween(inicioDaJanela, end),
    ]);

  const ateHoje = doMes.filter((t) => t.date <= todayISO);
  const futurasDoMes = doMes.filter((t) => t.date > todayISO && t.type === 'expense');

  const incomeCents = ateHoje
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amountCents, 0);
  const expenseCents = ateHoje
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amountCents, 0);

  const balanceCents = balanceOf(ateHoje);

  const forecastCents = forecastEndOfMonth({
    currentBalanceCents: balanceCents,
    pending: pendingRecurring(doAnterior, doMes),
    futureThisMonthCents: futurasDoMes.reduce((s, t) => s + t.amountCents, 0),
  });

  const committedCents = committedFutureCents(futurasParcelas, end);

  // Fatia de pizza por categoria, só despesas do mês, maiores primeiro.
  const porCategoria = new Map<string, number>();
  for (const t of doMes) {
    if (t.type !== 'expense') continue;
    porCategoria.set(t.categoryId, (porCategoria.get(t.categoryId) ?? 0) + t.amountCents);
  }

  const byCategory: CategorySlice[] = [...porCategoria.entries()]
    .map(([categoryId, valueCents]) => {
      const c = categorias.find((x) => x.id === categoryId);
      return {
        categoryId,
        label: c ? `${c.emoji} ${c.name}` : 'Sem categoria',
        color: c?.color ?? '#64748b',
        valueCents,
      };
    })
    .sort((a, b) => b.valueCents - a.valueCents);

  // Saldo de cada um dos últimos 12 meses.
  const monthlyBalances: MonthlyBalance[] = [];
  for (let i = 11; i >= 0; i--) {
    const m = shiftMonth(monthISO, -i);
    const faixa = monthRange(m);
    const doMesM = janela12.filter((t) => t.date >= faixa.start && t.date <= faixa.end);
    monthlyBalances.push({ monthISO: m, balanceCents: balanceOf(doMesM) });
  }

  const [ano, mes] = monthISO.split('-').map(Number);
  const ehMesCorrente = todayISO.slice(0, 7) === monthISO.slice(0, 7);

  const insights = buildInsights({
    budgets: orcamentos,
    // Em mês passado, o mês já correu inteiro.
    dayOfMonth: ehMesCorrente ? Number(todayISO.slice(8, 10)) : lastDayOfMonth(ano, mes),
    daysInMonth: lastDayOfMonth(ano, mes),
    totalIncomeCents: incomeCents,
    totalExpenseCents: expenseCents,
    transactionCount: doMes.length,
  });

  return {
    monthISO,
    incomeCents,
    expenseCents,
    balanceCents,
    forecastCents,
    committedCents,
    insights,
    byCategory,
    monthlyBalances,
  };
}
```

- [ ] **Step 2: Criar o componente de explicação**

Criar `src/components/ui/explain.tsx`:

```tsx
/**
 * O `?` ao lado de um número. Nenhum valor calculado aparece na tela sem que
 * a pessoa possa descobrir de onde ele saiu.
 */
export function Explain({ children }: { children: string }) {
  return (
    <span
      tabIndex={0}
      title={children}
      aria-label={children}
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full
                 border border-slate-300 text-[10px] text-slate-500
                 dark:border-slate-600 dark:text-slate-400"
    >
      ?
    </span>
  );
}
```

- [ ] **Step 3: Criar os cartões de resumo**

Criar `src/components/dashboard/summary-cards.tsx`. Server Component que recebe `DashboardData` e renderiza uma grade (2 colunas no celular, 4 no desktop) com:

| Cartão | Valor | Texto do `<Explain>` |
|---|---|---|
| Receitas | `incomeCents` | "Tudo que entrou até hoje neste mês." |
| Despesas | `expenseCents` | "Tudo que saiu até hoje neste mês, contando cada parcela no mês em que ela vence." |
| Saldo atual | `balanceCents` | "Receitas menos despesas até hoje." |
| Saldo previsto | `forecastCents` | "Estimativa de como o mês termina: saldo de hoje, mais as contas que costumam se repetir e ainda não foram lançadas, menos as despesas já marcadas para os próximos dias. É uma projeção, não uma certeza." |

Abaixo da grade, uma faixa larga: **"Comprometido com parcelas futuras"** com `committedCents` e o `<Explain>`: "Soma das parcelas que vencem depois deste mês. Esse dinheiro já está prometido, mesmo sem ter saído ainda."

Se `committedCents` for zero, esconder a faixa.

- [ ] **Step 4: Criar a faixa de insights**

Criar `src/components/dashboard/insights-bar.tsx`. Recebe `Insight[]` e renderiza um cartão por aviso, com a cor de fundo conforme a gravidade:

- `danger` → fundo vermelho claro, texto vermelho escuro
- `warning` → âmbar
- `success` → esmeralda
- `info` → cinza

Cada cartão tem `role="status"`. Nenhum ícone-só: a frase carrega o significado sozinha.

- [ ] **Step 5: Criar os gráficos**

Carregar a skill `dataviz` antes de escrever esta parte.

Criar `src/components/dashboard/category-pie.tsx` — Client Component (`'use client'`) com Recharts `PieChart`. Recebe `CategorySlice[]`. Cada fatia usa a `color` da própria categoria. Tooltip mostra `label` e valor formatado com `formatBRL`. Legenda abaixo no celular, à direita no desktop. Se a lista estiver vazia, renderizar "Nenhuma despesa neste mês." em vez de um gráfico vazio.

Criar `src/components/dashboard/balance-line.tsx` — Client Component com Recharts `LineChart`. Recebe `MonthlyBalance[]`. Eixo X com o mês abreviado (`ago`, `set`…), eixo Y formatado em milhares (`1,2 mil`). Linha de referência em zero. Tooltip com o mês por extenso e `formatBRL`.

Os dois envoltos em `<ResponsiveContainer>` e com altura fixa de 260px.

- [ ] **Step 6: Montar a página**

Modificar `src/app/(app)/page.tsx`:

```tsx
import { getDashboardData } from '@/queries/dashboard';
import { currentMonthISO, monthLabel } from '@/lib/month';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { InsightsBar } from '@/components/dashboard/insights-bar';
import { CategoryPie } from '@/components/dashboard/category-pie';
import { BalanceLine } from '@/components/dashboard/balance-line';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const hoje = new Date().toISOString().slice(0, 10);
  const monthISO = mes ?? currentMonthISO(hoje);

  const dados = await getDashboardData(monthISO, hoje);

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Resumo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{monthLabel(monthISO)}</p>
      </header>

      <SummaryCards data={dados} />
      <InsightsBar insights={dados.insights} />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
            Para onde foi o dinheiro
          </h2>
          <CategoryPie slices={dados.byCategory} />
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
            Seu saldo mês a mês
          </h2>
          <BalanceLine points={dados.monthlyBalances} />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 7: Verificar**

Run: `npm run dev`, abrir `/`

Com a TV em 10x e algumas despesas lançadas:

1. **"Despesas" mostra R$ 300 da TV, não R$ 3.000** — esta é a verificação mais importante do app
2. "Comprometido com parcelas futuras" mostra R$ 2.700
3. Passar o mouse (ou focar pelo teclado) no `?` de "Saldo previsto" mostra a explicação
4. Estourar um orçamento e conferir que a frase aparece na faixa de insights com o valor certo
5. Numa conta recém-criada, sem nenhum lançamento, aparece "Nenhum lançamento neste mês ainda."
6. O gráfico de pizza usa as cores das categorias
7. Nenhum gráfico estoura a largura no celular
8. Alternar o tema do sistema para escuro — os dois gráficos continuam legíveis

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: dashboard com resumo, insights e graficos de categoria e saldo"
```

---

### Task 20: Simulador à vista × parcelado

**Files:**
- Create: `src/app/(app)/simulador/page.tsx`
- Create: `src/components/simulator/simulator-form.tsx`
- Create: `src/components/simulator/simulator-result.tsx`

**Interfaces:**
- Consumes: `simulate` (Tarefa 6), `invoiceMonthFor` (Tarefa 4), `listCards`, `MoneyInput`, `Money`
- Produces: tela `/simulador`

O simulador roda inteiro no navegador — `lib/simulator.ts` é puro e não precisa de servidor. Nada é gravado no banco: é uma ferramenta de decisão, não um registro.

**A vantagem sobre o site de referência:** a carência não é digitada, é deduzida do cartão que a pessoa já cadastrou.

- [ ] **Step 1: Criar o formulário**

Criar `src/components/simulator/simulator-form.tsx`. Client Component com estado local e recálculo a cada mudança (sem botão "calcular"). Campos:

1. **Preço à vista** (PIX ou débito) — `<MoneyInput>`
2. **Em quantas vezes** — número, 1 a 24
3. **Valor de cada parcela** — `<MoneyInput>`. Ao lado, um botão "igual dividido" que preenche com `preçoÀVista / parcelas`
4. **Quanto seu dinheiro rende por mês** — botões de atalho `0,10%` (poupança), `0,90%` (CDI), `1,20%`, e um campo para digitar outro valor
5. **Cartão** — select com os cartões cadastrados, mais a opção "não usar cartão"
6. **Data da compra** — `<input type="date">`, padrão hoje. Só aparece quando um cartão foi escolhido

**Cálculo da carência:** quando há cartão e data, usar `invoiceMonthFor(data, closingDay)` para descobrir a fatura de destino e derivar quantos meses o dinheiro fica rendendo antes da primeira parcela. Sem cartão escolhido, `graceMonths = 1`.

Mostrar a carência em texto claro logo abaixo: *"Comprando hoje neste cartão, a primeira parcela só sai em 27/09 — seu dinheiro rende 2 meses antes disso."*

- [ ] **Step 2: Criar o resultado**

Criar `src/components/simulator/simulator-result.tsx`. Recebe `SimulatorResult` e renderiza:

- **O veredito em destaque**, com fundo verde quando `betterOption === 'installments'`, âmbar quando `'cash'`, cinza no empate. Usa `result.verdict` direto — a frase já vem pronta do módulo
- Uma tabela de quatro linhas:
  - "Total à vista" → `cashTotalCents`
  - "Total parcelado" → `installmentTotalCents`
  - "Diferença" → `differenceCents` com `<Explain>`: "Quanto o parcelado custa a mais em reais, sem contar o rendimento."
  - "Rendimento no período" → `investmentGainCents` com `<Explain>`: "Quanto seu dinheiro rende enquanto você paga as parcelas."
- **Juros escondidos no parcelamento**: `implicitMonthlyRatePercent` ao mês e `implicitAnnualRatePercent` ao ano, com uma linha explicativa: *"Mesmo quando a loja diz 'sem juros', se o preço à vista é menor, existe juros embutido. Aqui ele é de X% ao mês."* Quando a taxa é zero, mostrar "Não há juros embutido: o total parcelado é igual ou menor que o preço à vista."
- Botão **"Lançar essa compra"** que leva para `/transacoes` com os dados na query string (`valor`, `parcelas`, `cartao`, `data`), abrindo o formulário de lançamento já preenchido

- [ ] **Step 3: Ligar o botão ao formulário de lançamento**

Modificar `src/components/transactions/transaction-form.tsx` para ler os parâmetros `valor`, `parcelas`, `cartao` e `data` de `useSearchParams()` e, quando existirem, abrir já preenchido e com o painel aberto.

- [ ] **Step 4: Criar a página**

Criar `src/app/(app)/simulador/page.tsx`. Server Component que carrega `listCards()` e passa para o formulário. Cabeçalho:

> **Vale a pena parcelar?**
> Compare pagar de uma vez com parcelar deixando o dinheiro rendendo. O simulador considera até a folga que o cartão te dá antes da primeira parcela.

- [ ] **Step 5: Verificar**

Run: `npm run dev`, abrir `/simulador`

1. R$ 1.000 à vista, 10x de R$ 100, rendimento 0% → veredito de empate
2. Mesmo caso com rendimento 0,9% → "Parcelar é melhor" com um valor positivo
3. R$ 1.000 à vista, 10x de R$ 120, rendimento 0,9% → "Pagar à vista é melhor"
4. Caso 3 mostra juros embutidos maiores que zero
5. Escolher um cartão e uma data logo após o fechamento → a frase da carência aparece e o saldo final aumenta
6. "Lançar essa compra" abre `/transacoes` com valor, parcelas e cartão já preenchidos
7. No celular, os campos ficam empilhados e o resultado não estoura a tela

Run: `npm test` e `npx tsc --noEmit`
Expected: PASS e sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: simulador de compra a vista x parcelada usando o ciclo do cartao"
```

---

### Task 21: Publicação na Vercel

**Files:**
- Create: `README.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: o app inteiro
- Produces: URL pública acessível pelo celular

- [ ] **Step 1: Verificação final antes de publicar**

Run: `npm test`
Expected: PASS — todos os arquivos de teste, sem nenhum pulado.

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run build`
Expected: build completo, sem erro e sem aviso de página que deveria ser estática.

Run: `npm run lint`
Expected: sem erros.

**Não seguir para o passo seguinte com qualquer um desses vermelho.**

- [ ] **Step 2: Rodar os avisos de segurança do Supabase**

Usar `get_advisors` com `type: "security"` e depois com `type: "performance"`.

Expected em segurança: nenhuma tabela sem RLS, nenhuma política permissiva demais. Corrigir antes de publicar qualquer coisa.

Em performance, avaliar cada aviso; índice faltando em coluna de chave estrangeira usada em filtro deve ser criado numa migração `0004_indices.sql`.

- [ ] **Step 3: Escrever o README**

Criar `README.md` em português explicando, para alguém que não programa:

- o que o app faz
- como rodar na própria máquina (`npm install`, copiar `.env.example` para `.env.local`, preencher, `npm run dev`)
- onde ficam as migrações do banco e como aplicá-las
- **a regra do regime de caixa por parcela**, com o exemplo da TV de R$ 3.000 em 10x — é a decisão que mais gera dúvida ao olhar os números
- o que ainda não existe: leitor de notificações bancárias, importação OFX/CSV, metas, dívidas e investimentos

- [ ] **Step 4: Confirmar a publicação com o usuário**

Publicar coloca o app numa URL pública. Antes de qualquer comando de deploy, **perguntar ao usuário e esperar um sim explícito**, informando:

- que a URL será acessível por qualquer pessoa que a tenha (os dados continuam protegidos por login e RLS)
- que será necessário criar uma conta na Vercel, se ainda não houver

- [ ] **Step 5: Publicar**

Depois do sim:

```bash
npx vercel
```

Seguir o fluxo interativo. Configurar as duas variáveis de ambiente no painel da Vercel (Settings → Environment Variables), com os mesmos valores do `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Depois, o deploy de produção:

```bash
npx vercel --prod
```

- [ ] **Step 6: Liberar a URL no Supabase**

No painel do Supabase, em Authentication → URL Configuration, adicionar a URL da Vercel em "Site URL" e em "Redirect URLs" (incluindo `<url>/auth/callback`). Sem isso, o login com Google volta para o lugar errado.

Se o Google OAuth foi configurado na Tarefa 11, adicionar a URL da Vercel também nas origens autorizadas no Google Cloud Console.

- [ ] **Step 7: Verificar em produção**

Abrir a URL **no celular** e verificar:

1. Criar uma conta nova → as 32 categorias aparecem
2. Lançar uma despesa → aparece na lista e no resumo
3. Cadastrar um cartão e lançar uma compra em 6x → a prévia mostra as datas certas
4. A barra de navegação inferior funciona e não cobre o conteúdo
5. Os gráficos do dashboard cabem na tela
6. Sair e entrar de novo → os dados continuam lá
7. Login com Google, se configurado

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "docs: README com instrucoes de uso e a regra das parcelas"
```

---

## Verificação final do plano

Antes de declarar a Fase 1 concluída, confirmar cada item com o comando ou a tela na frente — nenhuma afirmação de "está pronto" sem a evidência correspondente:

- [ ] `npm test` verde, com pelo menos 130 testes nos nove módulos de `src/lib/` e em `src/queries/mappers.ts`
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run build` sem erros
- [ ] `scripts/prova-rls.md` existe e mostra `[]` na leitura cruzada e `403` na escrita cruzada
- [ ] Uma compra de R$ 3.000 em 10x aparece como R$ 300 no mês e R$ 2.700 em "comprometido"
- [ ] R$ 100 em 3x gera 33,34 + 33,33 + 33,33
- [ ] Os seis limites de cor do orçamento conferem (0%, 69,99%, 70%, 99,99%, 100%, acima)
- [ ] Categoria sem teto não mostra barra
- [ ] O app abre e é usável num celular de verdade

## O que fica para as próximas fases

- **Fase 2:** leitor de notificações bancárias com LLM e importação OFX/CSV, usando a tabela `import_batches` já criada
- **Fase 3:** metas de poupança, dívidas com Avalanche e Bola de Neve, investimentos, patrimônio e FIRE
