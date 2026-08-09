/**
 * Regras de senha do app.
 *
 * O Supabase tem uma checagem contra bases de senhas vazadas, mas ela é paga.
 * Isto aqui não substitui aquilo: pega os casos piores — senhas curtas, sem
 * variedade, óbvias, ou que contêm o próprio e-mail — que são justamente os
 * que aparecem primeiro numa tentativa de invasão por tentativa e erro.
 */

export const MIN_SENHA = 12;

/** Padrões que aparecem no topo de qualquer lista de senhas vazadas. */
const OBVIAS = [
  'senha',
  'password',
  'qwerty',
  'asdf',
  '123456',
  '654321',
  'abcdef',
  'iloveyou',
  'admin',
  'brasil',
  'flamengo',
  'corinthians',
];

/**
 * Devolve a mensagem do problema, ou `null` se a senha serve.
 *
 * Uma mensagem por vez, e sempre dizendo o que fazer: listar tudo que está
 * errado de uma vez faz a pessoa desistir.
 */
export function checkPassword(senha: string, email: string): string | null {
  if (senha.length < MIN_SENHA) {
    return `A senha precisa de pelo menos ${MIN_SENHA} caracteres.`;
  }

  const minuscula = senha.toLowerCase();

  // Só letras ou só números é o que um ataque testa primeiro.
  const temLetra = /[a-zA-Z]/.test(senha);
  const temNumero = /\d/.test(senha);
  const temSimbolo = /[^a-zA-Z0-9]/.test(senha);

  if (temLetra && !temNumero && !temSimbolo) return 'Misture letras e números na senha.';
  if (temNumero && !temLetra) return 'Misture letras e números na senha.';

  if (OBVIAS.some((p) => minuscula.includes(p))) {
    return 'Essa senha é fácil de adivinhar. Escolha outra que não use palavras comuns.';
  }

  // "aaaaaaaaaaaa" tem 12 caracteres e passaria no teste de tamanho.
  if (/(.)\1{5,}/.test(senha)) {
    return 'Essa senha é fácil de adivinhar. Evite repetir o mesmo caractere.';
  }

  if (/^(?:0123456789|1234567890|9876543210)/.test(senha) || /123456/.test(senha)) {
    return 'Essa senha é fácil de adivinhar. Evite sequências de números.';
  }

  // Quem descobre seu e-mail testa ele como senha antes de qualquer outra coisa.
  const nomeDoEmail = email.split('@')[0]?.toLowerCase() ?? '';
  if (nomeDoEmail.length > 3 && minuscula.includes(nomeDoEmail)) {
    return 'A senha não pode conter seu e-mail.';
  }

  return null;
}
