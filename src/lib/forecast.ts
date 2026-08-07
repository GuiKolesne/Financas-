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
