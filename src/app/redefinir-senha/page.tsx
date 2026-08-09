'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { updatePassword, type ResetState } from './actions';
import { MIN_SENHA } from '@/lib/password';

const estadoInicial: ResetState = { error: null };

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export default function RedefinirSenhaPage() {
  const [estado, salvar, salvando] = useActionState(updatePassword, estadoInicial);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Criar senha nova
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Escolha uma senha que você vai lembrar. Depois de salvar, você já
            entra direto.
          </p>
        </header>

        <form action={salvar} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">
              Senha nova
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_SENHA}
              className={campo}
            />
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              {MIN_SENHA} caracteres ou mais, misturando letras e números.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">
              Repita a senha
            </span>
            <input
              name="password_confirm"
              type="password"
              required
              autoComplete="new-password"
              className={campo}
            />
          </label>

          {estado.error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {estado.error}
            </p>
          )}

          <button
            disabled={salvando}
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {salvando ? 'Salvando…' : 'Salvar senha nova'}
          </button>

          <Link
            href="/esqueci-senha"
            className="block pt-1 text-center text-sm text-slate-500 underline underline-offset-4 dark:text-slate-400"
          >
            Pedir outro link
          </Link>
        </form>
      </div>
    </main>
  );
}
