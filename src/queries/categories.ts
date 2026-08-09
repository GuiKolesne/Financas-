import { createServerSupabase } from '@/lib/supabase/server';
import { rowToCategory } from './mappers';
import type { Category } from '@/lib/types';

const CAMPOS = 'id, name, emoji, color, type, is_archived';

/** Categorias ativas do usuário logado, despesas primeiro, em ordem alfabética. */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select(CAMPOS)
    .eq('is_archived', false)
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Não consegui carregar as categorias: ${error.message}`);
  return (data ?? []).map(rowToCategory);
}
