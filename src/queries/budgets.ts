import { createServerSupabase } from '@/lib/supabase/server';
import { monthRange } from '@/lib/month';
import { listCategories } from './categories';
import type { BudgetStatus } from '@/lib/types';

/**
 * Para cada categoria de despesa: o teto do mês (se houver) e o quanto já foi
 * gasto. Teto ausente vem como null — não é o mesmo que teto zero.
 */
export async function listBudgetStatus(monthISO: string): Promise<BudgetStatus[]> {
  const supabase = await createServerSupabase();
  const { start, end } = monthRange(monthISO);

  const [categorias, tetos, gastos] = await Promise.all([
    listCategories(),
    supabase.from('budgets').select('category_id, limit_cents').eq('month', start),
    supabase
      .from('transactions')
      .select('category_id, amount_cents')
      .eq('type', 'expense')
      .gte('date', start)
      .lte('date', end),
  ]);

  if (tetos.error) throw new Error(`Não consegui carregar os orçamentos: ${tetos.error.message}`);
  if (gastos.error) throw new Error(`Não consegui carregar os gastos: ${gastos.error.message}`);

  const tetoPor = new Map<string, number>(
    (tetos.data ?? []).map((t) => [t.category_id, t.limit_cents]),
  );

  const gastoPor = new Map<string, number>();
  for (const g of gastos.data ?? []) {
    gastoPor.set(g.category_id, (gastoPor.get(g.category_id) ?? 0) + g.amount_cents);
  }

  return categorias
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryEmoji: c.emoji,
      limitCents: tetoPor.get(c.id) ?? null,
      spentCents: gastoPor.get(c.id) ?? 0,
    }));
}
