import { Money } from '@/components/ui/money';
import { DeleteButtons } from './delete-buttons';
import type { Category, CreditCard, Transaction } from '@/lib/types';

/** "2026-08-27" → "27/08". */
function diaMes(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export function TransactionList({
  transactions,
  categories,
  cards,
  installmentTotals,
}: {
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  /** Quantas parcelas cada compra tem, para escrever "3/10". */
  installmentTotals: Record<string, number>;
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
        Nenhum lançamento com esses filtros. Tente mudar o mês ou limpar os filtros.
      </p>
    );
  }

  const porId = new Map(categories.map((c) => [c.id, c]));
  const cartaoPorId = new Map(cards.map((c) => [c.id, c]));

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {transactions.map((t) => {
        const categoria = porId.get(t.categoryId);
        const cartao = t.creditCardId ? cartaoPorId.get(t.creditCardId) : null;
        const total = t.installmentPlanId ? installmentTotals[t.installmentPlanId] : undefined;

        return (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className="text-lg">
              {categoria?.emoji ?? '📌'}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-slate-900 dark:text-slate-100">
                {t.description || categoria?.name || 'Sem descrição'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {categoria?.name}
                {t.installmentNumber && total ? (
                  <>
                    {' · '}
                    parcela {t.installmentNumber}/{total}
                    {cartao ? ` · ${cartao.nickname}` : ''}
                  </>
                ) : cartao ? (
                  ` · ${cartao.nickname}`
                ) : null}
                {t.isRecurring ? ' · repete todo mês' : ''}
              </p>
            </div>

            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {diaMes(t.date)}
            </span>

            <span className="shrink-0 font-medium">
              <Money cents={t.type === 'income' ? t.amountCents : -t.amountCents} colorBySign />
            </span>

            <DeleteButtons transactionId={t.id} installmentPlanId={t.installmentPlanId} />
          </li>
        );
      })}
    </ul>
  );
}
