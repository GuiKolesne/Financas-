import { budgetColor } from '@/lib/insights';
import { formatBRL } from '@/lib/money';
import { Money } from '@/components/ui/money';
import type { BudgetStatus } from '@/lib/types';

const FUNDO: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

/**
 * A barra colorida de uma categoria.
 *
 * Sem teto definido não há barra: mostrar uma barra vazia sugeriria um limite
 * de zero, que é coisa diferente de "não defini limite nenhum".
 */
export function BudgetBar({ status }: { status: BudgetStatus }) {
  const cor = budgetColor(status.spentCents, status.limitCents);

  if (cor === 'none') {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Gasto: <Money cents={status.spentCents} /> · sem teto definido
      </p>
    );
  }

  const limite = status.limitCents ?? 0;
  const fracao = limite > 0 ? Math.min(status.spentCents / limite, 1) : 1;
  const estourou = status.spentCents > limite;

  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-valuenow={Math.round(fracao * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Orçamento de ${status.categoryName}`}
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div className={`h-full ${FUNDO[cor]}`} style={{ width: `${fracao * 100}%` }} />
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        <Money cents={status.spentCents} /> de {formatBRL(limite)}
        {estourou && (
          <span className="ml-2 font-medium text-red-600 dark:text-red-400">
            {formatBRL(status.spentCents - limite)} acima do teto
          </span>
        )}
      </p>
    </div>
  );
}
