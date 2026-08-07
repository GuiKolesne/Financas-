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
export function addMonths(
  year: number,
  month: number,
  count: number,
): { year: number; month: number } {
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
