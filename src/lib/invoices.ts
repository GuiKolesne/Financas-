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
