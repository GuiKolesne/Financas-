'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase, requireUser } from '@/lib/supabase/server';
import { parseBRL } from '@/lib/money';
import { generateInstallments } from '@/lib/installments';
import { getCard } from '@/queries/cards';

const esquema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha uma data válida.'),
  amount: z.string(),
  type: z.enum(['income', 'expense']),
  category_id: z.uuid('Escolha uma categoria.'),
  description: z.string().trim().max(120).default(''),
  payment_method: z.enum(['pix', 'debit', 'cash', 'credit']),
  credit_card_id: z.union([z.uuid(), z.literal('')]).default(''),
  installments_count: z.coerce.number().int().min(1).max(60).default(1),
  // Checkbox ausente vira false; presente ("on") vira true.
  is_recurring: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
});

export type ActionState = { error: string | null };

function revalidarTudo() {
  revalidatePath('/');
  revalidatePath('/transacoes');
  revalidatePath('/cartoes');
  revalidatePath('/orcamentos');
}

export async function createTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const totalCents = parseBRL(d.amount);
  if (totalCents <= 0) return { error: 'O valor precisa ser maior que zero.' };

  const noCredito = d.payment_method === 'credit';
  const cartaoId = d.credit_card_id || null;

  if (noCredito && !cartaoId) {
    return { error: 'Escolha em qual cartão essa compra foi feita.' };
  }
  if (d.installments_count > 1 && !noCredito) {
    return { error: 'Só dá para parcelar compras no crédito.' };
  }

  const supabase = await createServerSupabase();

  // Lançamento simples: uma linha e pronto.
  if (d.installments_count === 1) {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      date: d.date,
      amount_cents: totalCents,
      type: d.type,
      category_id: d.category_id,
      description: d.description,
      payment_method: d.payment_method,
      credit_card_id: cartaoId,
      is_recurring: d.is_recurring,
    });

    if (error) return { error: 'Não consegui salvar o lançamento. Tente de novo.' };

    revalidarTudo();
    return { error: null };
  }

  // Compra parcelada: precisa do ciclo do cartão para datar cada parcela.
  const cartao = await getCard(cartaoId!);
  if (!cartao) return { error: 'Cartão não encontrado.' };

  const { data: plano, error: erroPlano } = await supabase
    .from('installment_plans')
    .insert({
      user_id: user.id,
      description: d.description,
      total_cents: totalCents,
      installments_count: d.installments_count,
      purchase_date: d.date,
      credit_card_id: cartao.id,
      category_id: d.category_id,
    })
    .select('id')
    .single();

  if (erroPlano || !plano) {
    return { error: 'Não consegui salvar a compra parcelada. Tente de novo.' };
  }

  const parcelas = generateInstallments({
    totalCents,
    count: d.installments_count,
    purchaseDate: d.date,
    closingDay: cartao.closingDay,
    dueDay: cartao.dueDay,
  });

  const { error: erroParcelas } = await supabase.from('transactions').insert(
    parcelas.map((p) => ({
      user_id: user.id,
      date: p.dueDate,
      amount_cents: p.amountCents,
      type: d.type,
      category_id: d.category_id,
      description: d.description,
      payment_method: 'credit' as const,
      credit_card_id: cartao.id,
      installment_plan_id: plano.id,
      installment_number: p.number,
      is_recurring: false,
    })),
  );

  if (erroParcelas) {
    // Não deixa um plano órfão sem parcelas no banco.
    await supabase.from('installment_plans').delete().eq('id', plano.id);
    return { error: 'Não consegui gerar as parcelas. Tente de novo.' };
  }

  revalidarTudo();
  return { error: null };
}

/** Editar uma parcela isolada muda só ela. Para mexer na compra toda, apague e refaça. */
export async function updateTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const id = String(formData.get('id') ?? '');
  const parsed = esquema.safeParse(Object.fromEntries(formData));
  if (!id) return { error: 'Lançamento não encontrado.' };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const amountCents = parseBRL(d.amount);
  if (amountCents <= 0) return { error: 'O valor precisa ser maior que zero.' };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('transactions')
    .update({
      date: d.date,
      amount_cents: amountCents,
      type: d.type,
      category_id: d.category_id,
      description: d.description,
      payment_method: d.payment_method,
      credit_card_id: d.credit_card_id || null,
      is_recurring: d.is_recurring,
    })
    .eq('id', id);

  if (error) return { error: 'Não consegui salvar a alteração. Tente de novo.' };

  revalidarTudo();
  return { error: null };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('transactions').delete().eq('id', id);

  revalidarTudo();
}

/** Apaga a compra-mãe e, por cascata, todas as parcelas dela de uma vez. */
export async function deleteInstallmentPlan(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get('installment_plan_id') ?? '');
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from('installment_plans').delete().eq('id', id);

  revalidarTudo();
}
