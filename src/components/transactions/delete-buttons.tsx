'use client';

import { useState } from 'react';
import { deleteTransaction, deleteInstallmentPlan } from '@/app/(app)/transacoes/actions';

/**
 * Ao apagar uma parcela, as duas intenções são legítimas: tirar só aquele mês
 * ou cancelar a compra toda. O app pergunta em vez de escolher sozinho.
 */
export function DeleteButtons({
  transactionId,
  installmentPlanId,
}: {
  transactionId: string;
  installmentPlanId: string | null;
}) {
  const [perguntando, setPerguntando] = useState(false);

  if (!installmentPlanId) {
    return (
      <form action={deleteTransaction}>
        <input type="hidden" name="id" value={transactionId} />
        <button
          className="text-xs text-slate-500 underline underline-offset-4 hover:text-red-600 dark:text-slate-400"
          aria-label="Excluir lançamento"
        >
          Excluir
        </button>
      </form>
    );
  }

  if (!perguntando) {
    return (
      <button
        onClick={() => setPerguntando(true)}
        className="text-xs text-slate-500 underline underline-offset-4 hover:text-red-600 dark:text-slate-400"
      >
        Excluir
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={deleteTransaction}>
        <input type="hidden" name="id" value={transactionId} />
        <button className="text-xs text-slate-600 underline underline-offset-4 dark:text-slate-400">
          Só esta parcela
        </button>
      </form>

      <form action={deleteInstallmentPlan}>
        <input type="hidden" name="installment_plan_id" value={installmentPlanId} />
        <button className="text-xs text-red-600 underline underline-offset-4 dark:text-red-400">
          A compra inteira
        </button>
      </form>

      <button
        onClick={() => setPerguntando(false)}
        className="text-xs text-slate-400 underline underline-offset-4"
      >
        Cancelar
      </button>
    </div>
  );
}
