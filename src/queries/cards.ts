import { createServerSupabase } from '@/lib/supabase/server';
import { rowToCard } from './mappers';
import type { CreditCard } from '@/lib/types';

const CAMPOS = 'id, nickname, brand, limit_cents, closing_day, due_day, color';

export async function listCards(): Promise<CreditCard[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('credit_cards')
    .select(CAMPOS)
    .order('nickname', { ascending: true });

  if (error) throw new Error(`Não consegui carregar os cartões: ${error.message}`);
  return (data ?? []).map(rowToCard);
}

export async function getCard(id: string): Promise<CreditCard | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('credit_cards')
    .select(CAMPOS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Não consegui carregar o cartão: ${error.message}`);
  return data ? rowToCard(data) : null;
}
