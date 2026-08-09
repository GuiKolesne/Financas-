/**
 * Onde é seguro mandar a pessoa depois de autenticar.
 *
 * O destino chega pela URL do link do e-mail, então é texto que qualquer um
 * pode escrever. Sem esta checagem, alguém montaria um link que autentica a
 * pessoa no app de verdade e, no instante seguinte, a joga num site clonado —
 * onde ela digitaria a senha achando que ainda está aqui.
 *
 * Só passa caminho interno. Qualquer outra coisa cai na raiz.
 */
export function safeInternalPath(destino: string | null): string {
  if (!destino) return '/';

  // Precisa começar com uma barra só. "//outro.com" e "/\outro.com" são lidos
  // pelo navegador como endereço de outro domínio, apesar da aparência.
  if (!destino.startsWith('/')) return '/';
  if (destino.startsWith('//') || destino.startsWith('/\\')) return '/';

  return destino;
}
