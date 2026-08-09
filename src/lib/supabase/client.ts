import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/** Client para Client Components — usado só no login com Google. */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
