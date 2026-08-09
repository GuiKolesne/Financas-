'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS = [
  { href: '/', label: 'Resumo', icone: '📊' },
  { href: '/transacoes', label: 'Lançamentos', icone: '📝' },
  { href: '/cartoes', label: 'Cartões', icone: '💳' },
  { href: '/orcamentos', label: 'Orçamentos', icone: '🎯' },
  { href: '/simulador', label: 'Simulador', icone: '🧮' },
  { href: '/categorias', label: 'Categorias', icone: '🏷️' },
];

export function Nav() {
  const atual = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white
                 md:inset-y-0 md:right-auto md:w-56 md:border-r md:border-t-0
                 dark:border-slate-800 dark:bg-slate-950"
    >
      <ul className="flex justify-around md:flex-col md:gap-1 md:p-3">
        {ITENS.map((item) => {
          const ativo = atual === item.href;

          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-2 py-2.5 text-xs
                            md:flex-row md:gap-3 md:rounded-lg md:px-3 md:text-sm
                            ${
                              ativo
                                ? 'font-medium text-slate-900 md:bg-slate-100 dark:text-slate-100 dark:md:bg-slate-900'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
              >
                <span aria-hidden>{item.icone}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
