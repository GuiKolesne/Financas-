import { listTransactions } from '@/queries/transactions';
import { listCategories } from '@/queries/categories';
import { listCards } from '@/queries/cards';
import { installmentTotalsByPlan } from '@/queries/installment-plans';
import { currentMonthISO } from '@/lib/month';
import { Money } from '@/components/ui/money';
import { Filters } from '@/components/transactions/filters';
import { TransactionList } from '@/components/transactions/transaction-list';
import type { TransactionType } from '@/lib/types';

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string; categoria?: string; busca?: string }>;
}) {
  const { mes, tipo, categoria, busca } = await searchParams;
  const month = mes ?? currentMonthISO();

  const [transacoes, categorias, cartoes, totaisDeParcelas] = await Promise.all([
    listTransactions({
      month,
      type: tipo === 'income' || tipo === 'expense' ? (tipo as TransactionType) : undefined,
      categoryId: categoria || undefined,
      search: busca || undefined,
    }),
    listCategories(),
    listCards(),
    installmentTotalsByPlan(),
  ]);

  const receitas = transacoes
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amountCents, 0);
  const despesas = transacoes
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amountCents, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Lançamentos</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Cada parcela aparece no mês em que ela vence, não no mês da compra.
        </p>
      </header>

      <Filters month={month} categories={categorias} />

      <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
        <div className="flex gap-2">
          <dt className="text-slate-500 dark:text-slate-400">Receitas</dt>
          <dd>
            <Money cents={receitas} />
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500 dark:text-slate-400">Despesas</dt>
          <dd>
            <Money cents={despesas} />
          </dd>
        </div>
        <div className="flex gap-2 font-medium">
          <dt className="text-slate-500 dark:text-slate-400">Saldo</dt>
          <dd>
            <Money cents={receitas - despesas} colorBySign />
          </dd>
        </div>
      </dl>

      <TransactionList
        transactions={transacoes}
        categories={categorias}
        cards={cartoes}
        installmentTotals={totaisDeParcelas}
      />
    </div>
  );
}
