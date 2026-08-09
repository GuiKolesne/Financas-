'use client';

import { useActionState } from 'react';
import { signIn, signUp, type AuthState } from './actions';

const estadoInicial: AuthState = { error: null };

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 ' +
  'placeholder:text-slate-400 focus:border-slate-500 focus:outline-none ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export default function LoginPage() {
  const [estado, entrar, entrando] = useActionState(signIn, estadoInicial);
  const [estadoCadastro, cadastrar, cadastrando] = useActionState(signUp, estadoInicial);

  const mensagem = estado.error ?? estadoCadastro.error;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Suas finanças
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Entre para ver seus lançamentos e orçamentos.
          </p>
        </header>

        <form className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">E-mail</span>
            <input name="email" type="email" required autoComplete="email" className={campo} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Senha</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              className={campo}
            />
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Pelo menos 8 caracteres.
            </span>
          </label>

          {mensagem && (
            <p
              role="alert"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {mensagem}
            </p>
          )}

          <button
            formAction={entrar}
            disabled={entrando || cadastrando}
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>

          <button
            formAction={cadastrar}
            disabled={entrando || cadastrando}
            className="w-full rounded-lg border border-slate-300 py-2.5 font-medium text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
          >
            {cadastrando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
      </div>
    </main>
  );
}
