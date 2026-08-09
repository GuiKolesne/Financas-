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
 *
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
