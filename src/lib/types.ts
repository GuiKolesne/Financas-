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
