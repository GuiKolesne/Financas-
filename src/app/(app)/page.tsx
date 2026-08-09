import Link from 'next/link';
import { getDashboardData } from '@/queries/dashboard';
import { currentMonthISO, monthLabel, shiftMonth } from '@/lib/month';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { InsightsBar } from '@/components/dashboard/insights-bar';
import { CategoryPie } from '@/components/dashboard/category-pie';
import { BalanceLine } from '@/components/dashboard/balance-line';

const navegacao =
  'rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-400';

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
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Resumo</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/?mes=${shiftMonth(monthISO, -1)}`} className={navegacao} aria-label="Mês anterior">
            ‹
          </Link>
          <span className="min-w-36 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {monthLabel(monthISO)}
          </span>
          <Link href={`/?mes=${shiftMonth(monthISO, 1)}`} className={navegacao} aria-label="Próximo mês">
            ›
          </Link>
        </div>
      </header>

      <SummaryCards data={dados} />
      <InsightsBar insights={dados.insights} />

      <section className="grid gap-5 md:grid-cols-2">
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
