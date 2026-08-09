'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';
import { parseBRL } from '@/lib/money';

const esquema = z.object({
  nickname: z.string().trim().min(1, 'Dê um apelido para o cartão.').max(40),
  brand: z.string().trim().max(30).default(''),
  limit: z.string().default('0'),
  closing_day: z.coerce
    .number()
    .int()
    .min(1, 'O dia de fechamento vai de 1 a 31.')
    .max(31, 'O dia de fechamento vai de 1 a 31.'),
  due_day: z.coerce
    .number()
    .int()
    .min(1, 'O dia de vencimento vai de 1 a 31.')
    .max(31, 'O dia de vencimento vai de 1 a 31.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Escolha uma cor válida.'),
});

export type ActionState = { error: string | null };

function toRow(dados: z.infer<typeof esquema>) {
  const { limit, ...resto } = dados;
  return { ...resto, limit_cents: parseBRL(limit) };
}

export async function createCard(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('credit_cards')
    .insert({ ...toRow(parsed.data), user_id: user.id });

  if (error) return { error: 'Não consegui salvar o cartão. Tente de novo.' };

  revalidatePath('/cartoes');
  revalidatePath('/transacoes');
  return { error: null };
}

export async function updateCard(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const id = String(formData.get('id') ?? '');
  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!id) return { error: 'Cartão não encontrado.' };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('credit_cards').update(toRow(parsed.data)).eq('id', id);

  if (error) return { error: 'Não consegui salvar a alteração. Tente de novo.' };

  revalidatePath('/cartoes');
  return { error: null };
}

/**
 * Apagar o cartão apaga junto as compras parceladas dele — o banco faz isso
 * em cascata. As parcelas somem dos meses futuros.
 */
export async function deleteCard(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('credit_cards').delete().eq('id', id);

  revalidatePath('/cartoes');
  revalidatePath('/transacoes');
  revalidatePath('/');
}
