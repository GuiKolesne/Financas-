import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCard } from '@/queries/cards';
import { listCardTransactionsFrom } from '@/queries/transactions';
import { listCategories } from '@/queries/categories';
import { installmentTotalsByPlan } from '@/queries/installment-plans';
import { groupIntoInvoices, currentAndNext } from '@/lib/invoices';
import { Money } from '@/components/ui/money';

/** "2026-08-27" → "27/08/2026". */
function porExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default async function FaturaPage({ params }: PageProps<'/cartoes/[id]'>) {
  const { id } = await params;

  const cartao = await getCard(id);
  if (!cartao) notFound();

  const hoje = new Date().toISOString().slice(0, 10);
  const [lancamentos, categorias, totaisDeParcelas] = await Promise.all([
    listCardTransactionsFrom(cartao.id, hoje),
    listCategories(),
    installmentTotalsByPlan(),
  ]);

  const faturas = groupIntoInvoices(lancamentos);
  const { current } = currentAndNext(faturas, hoje);
  const seguintes = faturas.filter((f) => current && f.dueDate > current.dueDate);
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <header className="space-y-1">
        <Link
          href="/cartoes"
          className="text-sm text-slate-500 underline underline-offset-4 dark:text-slate-400"
        >
          ‹ Todos os cartões
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {cartao.nickname}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Fecha dia {cartao.closingDay} · vence dia {cartao.dueDay}
        </p>
      </header>

      {!current ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Este cartão ainda não tem lançamentos.
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-medium text-slate-900 dark:text-slate-100">Fatura atual</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  vence em {porExtenso(current.dueDate)}
                </p>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                <Money cents={current.totalCents} />
              </p>
            </div>

            <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {current.transactions.map((t) => {
                const cat = categoriaPorId.get(t.categoryId);
                const total = t.installmentPlanId
                  ? totaisDeParcelas[t.installmentPlanId]
                  : undefined;

                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <span aria-hidden>{cat?.emoji ?? '📌'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-slate-900 dark:text-slate-100">
                        {t.description || cat?.name || 'Sem descrição'}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {cat?.name}
                        {t.installmentNumber && total
                          ? ` · parcela ${t.installmentNumber}/${total}`
                          : ''}
                      </p>
                    </div>
                    <Money cents={t.amountCents} />
                  </li>
                );
              })}
            </ul>
          </section>

          {seguintes.length > 0 && (
            <section>
              <h2 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
                Próximas faturas
              </h2>
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {seguintes.map((f) => (
                  <li key={f.dueDate} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-slate-700 dark:text-slate-300">
                      vence em {porExtenso(f.dueDate)}
                    </span>
                    <Money cents={f.totalCents} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
