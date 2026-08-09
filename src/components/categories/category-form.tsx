'use client';

import { useActionState } from 'react';
import { createCategory, type ActionState } from '@/app/(app)/categorias/actions';

const estadoInicial: ActionState = { error: null };

/** Formulário de criação de categoria. Fica no topo da tela de categorias. */
export function CategoryForm() {
  const [estado, criar, criando] = useActionState(createCategory, estadoInicial);

  return (
    <form
      action={criar}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
    >
      <label className="flex-1 basis-40">
        <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Nome</span>
        <input
          name="name"
          required
          maxLength={60}
          placeholder="Ex: Academia"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      <label className="w-20">
        <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Emoji</span>
        <input
          name="emoji"
          maxLength={8}
          defaultValue="📌"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      <label className="w-24">
        <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Tipo</span>
        <select
          name="type"
          defaultValue="expense"
          className="w-full rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </label>

      <label className="w-20">
        <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Cor</span>
        <input
          name="color"
          type="color"
          defaultValue="#64748b"
          className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700"
        />
      </label>

      <button
        disabled={criando}
        className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
      >
        {criando ? 'Salvando…' : 'Adicionar'}
      </button>

      {estado.error && (
        <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">
          {estado.error}
        </p>
      )}
    </form>
  );
}
