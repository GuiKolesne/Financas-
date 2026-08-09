'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkPassword } from '@/lib/password';

/**
 * No login só validamos o formato. A exigência de força vale no cadastro:
 * aplicá-la aqui trancaria para fora quem criou a conta com uma senha antiga,
 * sem ter como trocá-la.
 */
const credenciais = z.object({
  email: z.email('Digite um e-mail válido.'),
  password: z.string().min(1, 'Digite sua senha.'),
});

export type AuthState = { error: string | null };

/**
 * Traduz o código de erro do Supabase para algo acionável.
 *
 * Uma mensagem genérica aqui seria pior que inútil: quem digitou um domínio
 * inválido ou esbarrou no limite de e-mails do plano gratuito ficaria tentando
 * de novo sem saber o que mudar. No login é diferente — lá o genérico é
 * proposital, para não revelar quais e-mails existem.
 */
function mensagemDeCadastro(code: string | undefined): string {
  switch (code) {
    case 'email_address_invalid':
      return 'Esse endereço de e-mail não é aceito. Use um e-mail comum, como Gmail ou Outlook.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Esse e-mail já tem conta. Use o botão "Entrar".';
    case 'weak_password':
      return 'Escolha uma senha mais forte — misture letras e números.';
    case 'over_email_send_rate_limit':
      return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
    default:
      return 'Não consegui criar a conta agora. Tente de novo em instantes.';
  }
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credenciais.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Mensagem genérica de propósito: não confirmamos se o e-mail existe.
    return { error: 'E-mail ou senha incorretos.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credenciais.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const fraca = checkPassword(parsed.data.password, parsed.data.email);
  if (fraca) return { error: fraca };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { error: mensagemDeCadastro(error.code) };
  }

  // Com "Confirm email" ligado, o cadastro nasce sem sessão: a pessoa precisa
  // clicar no link do e-mail. Dizer isso é melhor que mandá-la para uma tela
  // que vai devolvê-la ao login sem explicação.
  if (!data.session) {
    return {
      error: 'Conta criada. Confira seu e-mail e clique no link de confirmação para entrar.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
