'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkPassword, MIN_SENHA } from '@/lib/password';

export type ResetState = { error: string | null };

export async function updatePassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const senha = String(formData.get('password') ?? '');
  const confirmacao = String(formData.get('password_confirm') ?? '');

  if (senha !== confirmacao) {
    return { error: 'As duas senhas não são iguais.' };
  }

  const supabase = await createServerSupabase();

  // O link do e-mail já criou uma sessão temporária. Sem ela, não há a quem
  // trocar a senha — e é isso que impede alguém de abrir esta tela direto.
  const { data, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !data.user) {
    return {
      error: 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".',
    };
  }

  const fraca = checkPassword(senha, data.user.email ?? '');
  if (fraca) return { error: fraca };

  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    if (error.code === 'same_password') {
      return { error: `A senha nova precisa ser diferente da anterior.` };
    }
    return { error: `Não consegui trocar a senha. Ela precisa de ${MIN_SENHA} caracteres ou mais.` };
  }

  revalidatePath('/', 'layout');
  redirect('/?senha=trocada');
}
