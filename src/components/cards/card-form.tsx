'use client';

import { useActionState } from 'react';
import { createCard, type ActionState } from '@/app/(app)/cartoes/actions';
import { MoneyInput } from '@/components/ui/money-input';

const estadoInicial: ActionState = { error: null };

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

const rotulo = 'mb-1 block text-sm text-slate-700 dark:text-slate-300';

export function CardForm() {
  const [estado, criar, criando] = useActionState(createCard, estadoInicial);

  return (
    <form
      action={criar}
      className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
    >
      <h2 className="font-medium text-slate-900 dark:text-slate-100">Cadastrar um cartão</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className={rotulo}>Apelido</span>
          <input name="nickname" required maxLength={40} placeholder="Ex: Nubank roxinho" className={campo} />
        </label>

        <label>
          <span className={rotulo}>Bandeira</span>
          <input name="brand" maxLength={30} placeholder="Ex: Mastercard" className={campo} />
        </label>

        <label>
          <span className={rotulo}>Dia de fechamento</span>
          <input name="closing_day" type="number" min={1} max={31} required defaultValue={20} className={campo} />
        </label>

        <label>
          <span className={rotulo}>Dia de vencimento</span>
          <input name="due_day" type="number" min={1} max={31} required defaultValue={27} className={campo} />
        </label>

        <label>
          <span className={rotulo}>Limite (opcional)</span>
          <MoneyInput name="limit" required={false} />
        </label>

        <label>
          <span className={rotulo}>Cor</span>
          <input
            name="color"
            type="color"
            defaultValue="#7c3aed"
            className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700"
          />
        </label>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        O <strong>dia de fechamento</strong> é quando a fatura para de aceitar compras
        novas; o <strong>dia de vencimento</strong> é quando você paga. Os dois vêm no
        seu extrato ou no aplicativo do banco. É com eles que o app descobre em qual
        mês cada parcela vai cair.
      </p>

      {estado.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {estado.error}
        </p>
      )}

      <button
        disabled={criando}
        className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
      >
        {criando ? 'Salvando…' : 'Cadastrar cartão'}
      </button>
    </form>
  );
}
