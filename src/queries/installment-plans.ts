import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Quantas parcelas cada compra parcelada tem, indexado pelo id do plano.
 * É o que permite escrever "parcela 3/10" ao lado de um lançamento sem
 * precisar contar as linhas irmãs a cada renderização.
 */
export async function installmentTotalsByPlan(): Promise<Record<string, number>> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('installment_plans')
    .select('id, installments_count');

  if (error) {
    throw new Error(`Não consegui carregar as compras parceladas: ${error.message}`);
  }

  return Object.fromEntries((data ?? []).map((p) => [p.id, p.installments_count]));
}
