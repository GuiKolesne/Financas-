import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { safeInternalPath } from '@/lib/safe-redirect';

/**
 * Onde a pessoa cai depois de clicar num link que o Supabase mandou —
 * seja o retorno do Google, seja o link de redefinir senha.
 *
 * O `next` diz para onde seguir depois de trocar o código por uma sessão.
 * Só aceitamos caminhos internos: um `next` vindo de fora poderia mandar a
 * pessoa recém-autenticada para um site qualquer.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const destino = safeInternalPath(searchParams.get('next'));

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/login?erro=link`);
}
