import { createServerSupabase } from '@/lib/supabase/server';
import { rowToTransaction } from './mappers';
import { monthRange } from '@/lib/month';
import type { Transaction, TransactionType } from '@/lib/types';

// Precisa ser uma string literal única: o Supabase tipa o retorno lendo este
// texto em tempo de compilação, e concatenação com `+` quebra essa leitura.
const CAMPOS =
  'id, date, amount_cents, type, category_id, description, payment_method, credit_card_id, installment_plan_id, installment_number, is_recurring';

export interface TransactionFilters {
  /** Dia 1 do mês, ISO. Ausente = todos os meses. */
  month?: string;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
}

/** Lançamentos do usuário logado, mais recentes primeiro. */
export async function listTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const supabase = await createServerSupabase();

  let query = supabase.from('transactions').select(CAMPOS);

  if (filters.month) {
    const { start, end } = monthRange(filters.month);
    query = query.gte('date', start).lte('date', end);
  }
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.search) {
    // Escapa % e _ para o texto digitado não virar curinga sem querer.
    const termo = filters.search.replace(/[%_]/g, '\\$&');
    query = query.ilike('description', `%${termo}%`);
  }

  const { data, error } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Não consegui carregar os lançamentos: ${error.message}`);
  return (data ?? []).map(rowToTransaction);
}

/** Intervalo arbitrário — usado pelas faturas e pelo dashboard. */
export async function listTransactionsBetween(
  startISO: string,
  endISO: string,
): Promise<Transaction[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('transactions')
    .select(CAMPOS)
    .gte('date', startISO)
    .lte('date', endISO)
    .order('date', { ascending: true });

  if (error) throw new Error(`Não consegui carregar os lançamentos: ${error.message}`);
  return (data ?? []).map(rowToTransaction);
}

/** Lançamentos de um cartão específico, de uma data em diante. */
export async function listCardTransactionsFrom(
  cardId: string,
  startISO: string,
): Promise<Transaction[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('transactions')
    .select(CAMPOS)
    .eq('credit_card_id', cardId)
    .gte('date', startISO)
    .order('date', { ascending: true });

  if (error) throw new Error(`Não consegui carregar a fatura: ${error.message}`);
  return (data ?? []).map(rowToTransaction);
}
