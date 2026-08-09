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

/**
 * A pizza aguenta no máximo 6 fatias antes de as fatias finas virarem ruído.
 * As 5 maiores ficam, o resto vira "Outras categorias" em cinza neutro.
 */
function top5MaisOutros(fatias: CategorySlice[]): CategorySlice[] {
  if (fatias.length <= 6) return fatias;

  const maiores = fatias.slice(0, 5);
  const resto = fatias.slice(5);

  return [
    ...maiores,
    {
      categoryId: '__outros__',
      label: `Outras ${resto.length} categorias`,
      color: '#94a3b8',
      valueCents: resto.reduce((s, f) => s + f.valueCents, 0),
    },
  ];
}

/** Monta tudo que o dashboard mostra. */
export async function getDashboardData(
  monthISO: string,
  todayISO: string,
): Promise<DashboardData> {
  const { start, end } = monthRange(monthISO);
  const mesAnterior = monthRange(shiftMonth(monthISO, -1));
  const inicioDaJanela = monthRange(shiftMonth(monthISO, -11)).start;
  // O banco limita o parcelamento a 60x, então 5 anos cobrem qualquer compra.
  const fimDoHorizonte = `${Number(end.slice(0, 4)) + 5}-12-31`;

  const [doMes, doAnterior, futuras, categorias, orcamentos, janela12] = await Promise.all([
    listTransactionsBetween(start, end),
    listTransactionsBetween(mesAnterior.start, mesAnterior.end),
    listTransactionsBetween(start, fimDoHorizonte),
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

  const committedCents = committedFutureCents(futuras, end);

  // Despesas por categoria no mês, maiores primeiro.
  const porCategoria = new Map<string, number>();
  for (const t of doMes) {
    if (t.type !== 'expense') continue;
    porCategoria.set(t.categoryId, (porCategoria.get(t.categoryId) ?? 0) + t.amountCents);
  }

  const todasAsFatias: CategorySlice[] = [...porCategoria.entries()]
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
    byCategory: top5MaisOutros(todasAsFatias),
    monthlyBalances,
  };
}
