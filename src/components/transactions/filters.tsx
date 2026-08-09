'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { monthLabel, shiftMonth } from '@/lib/month';
import type { Category } from '@/lib/types';

const pilula =
  'shrink-0 rounded-full border px-3 py-1.5 text-sm transition ' +
  'border-slate-300 text-slate-600 hover:bg-slate-100 ' +
  'dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900';

const pilulaAtiva =
  'shrink-0 rounded-full border px-3 py-1.5 text-sm ' +
  'border-slate-900 bg-slate-900 text-white ' +
  'dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900';

/** Filtros rápidos. Tudo vive na URL, então voltar no navegador funciona. */
export function Filters({ month, categories }: { month: string; categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const tipoAtual = params.get('tipo') ?? '';
  const categoriaAtual = params.get('categoria') ?? '';
  const [busca, setBusca] = useState(params.get('busca') ?? '');

  function irPara(mudancas: Record<string, string>) {
    const novos = new URLSearchParams(params.toString());
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
    }
    router.push(`/transacoes?${novos.toString()}`);
  }

  // Espera a pessoa parar de digitar antes de recarregar a lista.
  useEffect(() => {
    const atual = params.get('busca') ?? '';
    if (busca === atual) return;

    const timer = setTimeout(() => irPara({ busca }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => irPara({ mes: shiftMonth(month, -1) })}
          aria-label="Mês anterior"
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-400"
        >
          ‹
        </button>
        <span className="min-w-40 text-center font-medium text-slate-900 dark:text-slate-100">
          {monthLabel(month)}
        </span>
        <button
          onClick={() => irPara({ mes: shiftMonth(month, 1) })}
          aria-label="Próximo mês"
          className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-400"
        >
          ›
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* aria-pressed: sem ele, o filtro ativo só existiria como cor, e
            quem usa leitor de tela não saberia o que está selecionado. */}
        <button
          onClick={() => irPara({ tipo: '' })}
          aria-pressed={tipoAtual === ''}
          className={tipoAtual === '' ? pilulaAtiva : pilula}
        >
          Tudo
        </button>
        <button
          onClick={() => irPara({ tipo: 'income' })}
          aria-pressed={tipoAtual === 'income'}
          className={tipoAtual === 'income' ? pilulaAtiva : pilula}
        >
          Receitas
        </button>
        <button
          onClick={() => irPara({ tipo: 'expense' })}
          aria-pressed={tipoAtual === 'expense'}
          className={tipoAtual === 'expense' ? pilulaAtiva : pilula}
        >
          Despesas
        </button>

        <select
          value={categoriaAtual}
          onChange={(e) => irPara({ categoria: e.target.value })}
          aria-label="Filtrar por categoria"
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar na descrição"
          aria-label="Buscar na descrição"
          className="w-44 shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        />
      </div>
    </div>
  );
}
