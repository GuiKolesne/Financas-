'use client';

import { useActionState } from 'react';
import { setBudget, type ActionState } from '@/app/(app)/orcamentos/actions';
import { MoneyInput } from '@/components/ui/money-input';
import { BudgetBar } from './budget-bar';
import type { BudgetStatus } from '@/lib/types';

const estadoInicial: ActionState = { error: null };

/** Uma categoria: seu teto editável e a barra do quanto já foi gasto. */
export function BudgetRow({ status, month }: { status: BudgetStatus; month: string }) {
  const [estado, salvar, salvando] = useActionState(setBudget, estadoInicial);
  const campoId = `teto-${status.categoryId}`;

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden>{status.categoryEmoji}</span>
        <span className="flex-1 text-slate-900 dark:text-slate-100">{status.categoryName}</span>

        <form action={salvar} className="flex items-center gap-2">
          <input type="hidden" name="category_id" value={status.categoryId} />
          <input type="hidden" name="month" value={month} />

          <label htmlFor={campoId} className="sr-only">
            Teto de {status.categoryName}
          </label>
          <div className="w-36">
            <MoneyInput
              id={campoId}
              name="limit"
              defaultCents={status.limitCents ?? 0}
              required={false}
            />
          </div>

          <button
            disabled={salvando}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
          >
            {salvando ? '…' : 'Salvar'}
          </button>
        </form>
      </div>

      <BudgetBar status={status} />

      {estado.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {estado.error}
        </p>
      )}
    </li>
  );
}
