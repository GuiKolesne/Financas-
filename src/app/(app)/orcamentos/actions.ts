'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';
import { parseBRL } from '@/lib/money';
import { shiftMonth } from '@/lib/month';

const esquema = z.object({
  category_id: z.uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Mês inválido.'),
  limit: z.string(),
});

export type ActionState = { error: string | null };

/**
 * Define ou atualiza o teto de uma categoria no mês.
 * Teto zerado apaga a linha: voltar a "sem orçamento" precisa ser possível,
 * e é diferente de um teto de R$ 0,00.
 */
export async function setBudget(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { category_id, month, limit } = parsed.data;
  const limitCents = parseBRL(limit);
  const supabase = await createServerSupabase();

  if (limitCents <= 0) {
    await supabase.from('budgets').delete().eq('category_id', category_id).eq('month', month);
  } else {
    const { error } = await supabase.from('budgets').upsert(
      { user_id: user.id, category_id, month, limit_cents: limitCents },
      { onConflict: 'user_id,category_id,month' },
    );

    if (error) return { error: 'Não consegui salvar o orçamento. Tente de novo.' };
  }

  revalidatePath('/orcamentos');
  revalidatePath('/');
  return { error: null };
}

/** Copia os tetos do mês anterior. Não sobrescreve o que já foi definido. */
export async function copyBudgetsFromPreviousMonth(formData: FormData): Promise<void> {
  const user = await requireUser();
  const month = String(formData.get('month') ?? '');
  if (!/^\d{4}-\d{2}-01$/.test(month)) return;

  const anterior = shiftMonth(month, -1);
  const supabase = await createServerSupabase();

  const [origem, destino] = await Promise.all([
    supabase.from('budgets').select('category_id, limit_cents').eq('month', anterior),
    supabase.from('budgets').select('category_id').eq('month', month),
  ]);

  const jaDefinidos = new Set((destino.data ?? []).map((b) => b.category_id));
  const novos = (origem.data ?? [])
    .filter((b) => !jaDefinidos.has(b.category_id))
    .map((b) => ({
      user_id: user.id,
      category_id: b.category_id,
      month,
      limit_cents: b.limit_cents,
    }));

  if (novos.length > 0) await supabase.from('budgets').insert(novos);

  revalidatePath('/orcamentos');
  revalidatePath('/');
}
