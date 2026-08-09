'use client';

/** Rede de segurança: erro inesperado nunca vira tela branca. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Algo deu errado
      </h1>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
        Não consegui carregar esta tela. Seus dados estão seguros — isso foi um
        problema aqui, não com o que você cadastrou.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
      >
        Tentar de novo
      </button>
    </main>
  );
}
