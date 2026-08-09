'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordReset, type RecoveryState } from './actions';

const estadoInicial: RecoveryState = { error: null, enviado: false };

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export default function EsqueciSenhaPage() {
  const [estado, enviar, enviando] = useActionState(requestPasswordReset, estadoInicial);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Esqueci minha senha
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Digite seu e-mail e eu mando um link para você criar uma senha nova.
          </p>
        </header>

        {estado.enviado ? (
          <div className="space-y-4 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="text-slate-800 dark:text-slate-200">
              Se existir uma conta com esse e-mail, o link já está a caminho.
              Confira sua caixa de entrada — e o spam, que é onde ele costuma cair.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              O link vale por uma hora. Depois de usá-lo, ele não funciona de novo.
            </p>
            <Link
              href="/login"
              className="block text-center underline underline-offset-4 text-slate-700 dark:text-slate-300"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form action={enviar} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700 dark:text-slate-300">E-mail</span>
              <input name="email" type="email" required autoComplete="email" className={campo} />
            </label>

            {estado.error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {estado.error}
              </p>
            )}

            <button
              disabled={enviando}
              className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {enviando ? 'Enviando…' : 'Enviar link'}
            </button>

            <Link
              href="/login"
              className="block pt-1 text-center text-sm text-slate-500 underline underline-offset-4 dark:text-slate-400"
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
