/**
 * Dinheiro no app é sempre um inteiro de centavos. Este módulo é a única
 * fronteira entre esse inteiro e o texto que a pessoa lê ou digita.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 → "R$ 1.234,56". Negativo vira "-R$ 1.234,56". */
export function formatBRL(cents: number): string {
  const sinal = cents < 0 ? '-' : '';
  return `${sinal}R$ ${BRL.format(Math.abs(cents) / 100)}`;
}

/** Mesmo que formatBRL, sem o prefixo — para dentro de campos de digitação. */
export function formatBRLCompact(cents: number): string {
  const sinal = cents < 0 ? '-' : '';
  return `${sinal}${BRL.format(Math.abs(cents) / 100)}`;
}

/**
 * Lê o formato brasileiro e devolve centavos.
 * Descarta tudo que não for dígito ou vírgula; a vírgula é o decimal.
 */
export function parseBRL(input: string): number {
  const limpo = input.replace(/[^\d,]/g, '');
  if (limpo === '') return 0;

  const [inteira, decimal = ''] = limpo.split(',');
  const reais = inteira === '' ? 0 : Number(inteira);
  const centavos = Number(decimal.padEnd(2, '0').slice(0, 2));

  return reais * 100 + centavos;
}

/** 1234.56 → 123456, imune ao erro de ponto flutuante. */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}
