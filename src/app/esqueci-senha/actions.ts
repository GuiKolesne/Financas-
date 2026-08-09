'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const esquema = z.object({
  email: z.email('Digite um e-mail válido.'),
});

export type RecoveryState = { error: string | null; enviado: boolean };

export async function requestPasswordReset(
  _prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const parsed = esquema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, enviado: false };
  }

  // A origem vem do cabeçalho para o link funcionar tanto em localhost quanto
  // no endereço publicado, sem precisar de variável de ambiente.
  const cabecalhos = await headers();
  const host = cabecalhos.get('host') ?? '';
  const protocolo = host.startsWith('localhost') ? 'http' : 'https';
  const origem = `${protocolo}://${host}`;

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origem}/auth/callback?next=/redefinir-senha`,
  });

  // O limite de envio é a única falha que vale contar: a pessoa precisa saber
  // que deve esperar, senão fica clicando achando que não funcionou.
  if (error?.code === 'over_email_send_rate_limit') {
    return {
      error: 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.',
      enviado: false,
    };
  }

  // Fora isso, a resposta é sempre a mesma, dê certo ou não. Dizer "esse e-mail
  // não existe" entregaria para qualquer curioso quais e-mails têm conta aqui.
  return { error: null, enviado: true };
}
