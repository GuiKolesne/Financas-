import { listCategories } from '@/queries/categories';
import { archiveCategory } from './actions';
import { CategoryForm } from '@/components/categories/category-form';
import type { Category } from '@/lib/types';

function Lista({ titulo, itens }: { titulo: string; itens: Category[] }) {
  return (
    <section>
      <h2 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
        {titulo}{' '}
        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
          ({itens.length})
        </span>
      </h2>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {itens.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span aria-hidden>{c.emoji}</span>
            <span className="flex-1 text-slate-800 dark:text-slate-200">{c.name}</span>

            <form action={archiveCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                Arquivar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function CategoriasPage() {
  const categorias = await listCategories();
  const despesas = categorias.filter((c) => c.type === 'expense');
  const receitas = categorias.filter((c) => c.type === 'income');

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Categorias</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Estas são as caixinhas onde seus lançamentos são organizados. Você pode
          criar novas, trocar a cor ou arquivar as que não usa. Arquivar não apaga
          nada do que você já lançou.
        </p>
      </header>

      <CategoryForm />

      <Lista titulo="Despesas" itens={despesas} />
      <Lista titulo="Receitas" itens={receitas} />
    </div>
  );
}
