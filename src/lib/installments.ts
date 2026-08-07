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
