import Link from 'next/link';
import { listBudgetStatus } from '@/queries/budgets';
import { currentMonthISO, monthLabel, shiftMonth } from '@/lib/month';
import { Money } from '@/components/ui/money';
import { BudgetRow } from '@/components/budgets/budget-row';
import { copyBudgetsFromPreviousMonth } from './actions';

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes ?? currentMonthISO();

  const status = await listBudgetStatus(month);

  const comTeto = status.filter((s) => s.limitCents !== null);
  const semTeto = status.filter((s) => s.limitCents === null);

  const totalOrcado = comTeto.reduce((s, b) => s + (b.limitCents ?? 0), 0);
  const totalGasto = comTeto.reduce((s, b) => s + b.spentCents, 0);

  const navegacao = 'rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-400';

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Orçamentos</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Defina quanto você quer gastar em cada categoria. A barra enche conforme
          você lança as despesas do mês.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/orcamentos?mes=${shiftMonth(month, -1)}`} className={navegacao} aria-label="Mês anterior">
          ‹
        </Link>
        <span className="min-w-40 text-center font-medium text-slate-900 dark:text-slate-100">
          {monthLabel(month)}
        </span>
        <Link href={`/orcamentos?mes=${shiftMonth(month, 1)}`} className={navegacao} aria-label="Próximo mês">
          ›
        </Link>

        <form action={copyBudgetsFromPreviousMonth} className="ml-auto">
          <input type="hidden" name="month" value={month} />
          <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
            Copiar do mês anterior
          </button>
        </form>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
        <div className="flex gap-2">
          <dt className="text-slate-500 dark:text-slate-400">Orçado</dt>
          <dd>
            <Money cents={totalOrcado} />
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500 dark:text-slate-400">Gasto</dt>
          <dd>
            <Money cents={totalGasto} />
          </dd>
        </div>
        <div className="flex gap-2 font-medium">
          <dt className="text-slate-500 dark:text-slate-400">Sobra</dt>
          <dd>
            <Money cents={totalOrcado - totalGasto} colorBySign />
          </dd>
        </div>
      </dl>

      {comTeto.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {comTeto.map((s) => (
            <BudgetRow key={s.categoryId} status={s} month={month} />
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
          Ainda sem teto definido
        </h2>
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {semTeto.map((s) => (
            <BudgetRow key={s.categoryId} status={s} month={month} />
          ))}
        </ul>
      </section>
    </div>
  );
}
