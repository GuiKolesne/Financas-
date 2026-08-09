'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';

const esquema = z.object({
  name: z.string().trim().min(1, 'Dê um nome para a categoria.').max(60),
  emoji: z.string().trim().max(8).default('📌'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor válida.'),
  type: z.enum(['income', 'expense']),
});

export type ActionState = { error: string | null };

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('categories')
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { error: 'Não consegui salvar a categoria. Tente de novo.' };

  revalidatePath('/categorias');
  return { error: null };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const id = String(formData.get('id') ?? '');
  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!id) return { error: 'Categoria não encontrada.' };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('categories').update(parsed.data).eq('id', id);

  if (error) return { error: 'Não consegui salvar a alteração. Tente de novo.' };

  revalidatePath('/categorias');
  return { error: null };
}

/**
 * Categoria com lançamentos não é apagada, é arquivada — apagar quebraria o
 * histórico. O banco impede a exclusão com `on delete restrict`.
 */
export async function archiveCategory(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('categories').update({ is_archived: true }).eq('id', id);

  revalidatePath('/categorias');
  revalidatePath('/orcamentos');
}
