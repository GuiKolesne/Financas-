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
