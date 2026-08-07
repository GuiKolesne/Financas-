import { describe, it, expect } from 'vitest';
import { formatBRL, formatBRLCompact, parseBRL, toCents, sumCents } from './money';

describe('formatBRL', () => {
  it('formata milhares com ponto e centavos com virgula', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
  });

  it('formata valor abaixo de um real', () => {
    expect(formatBRL(5)).toBe('R$ 0,05');
  });

  it('formata zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('formata valor negativo com o sinal antes do simbolo', () => {
    expect(formatBRL(-123456)).toBe('-R$ 1.234,56');
  });

  it('formata milhoes', () => {
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89');
  });
});

describe('formatBRLCompact', () => {
  it('omite o prefixo R$', () => {
    expect(formatBRLCompact(123456)).toBe('1.234,56');
  });
});

describe('parseBRL', () => {
  it('interpreta o formato brasileiro completo', () => {
    expect(parseBRL('R$ 1.234,56')).toBe(123456);
  });

  it('interpreta sem simbolo de moeda', () => {
    expect(parseBRL('1.234,56')).toBe(123456);
  });

  it('interpreta valor inteiro sem centavos', () => {
    expect(parseBRL('1234')).toBe(123400);
  });

  it('interpreta um unico digito de centavos como decimo', () => {
    expect(parseBRL('10,5')).toBe(1050);
  });

  it('devolve zero para entrada vazia', () => {
    expect(parseBRL('')).toBe(0);
  });

  it('devolve zero para entrada sem digitos', () => {
    expect(parseBRL('abc')).toBe(0);
  });

  it('ignora digitos alem do segundo decimal', () => {
    expect(parseBRL('10,567')).toBe(1056);
  });
});

describe('toCents', () => {
  it('converte reais para centavos arredondando', () => {
    expect(toCents(1234.56)).toBe(123456);
  });

  it('nao sofre com erro de ponto flutuante', () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe('sumCents', () => {
  it('soma uma lista de centavos', () => {
    expect(sumCents([100, 200, 350])).toBe(650);
  });

  it('soma lista vazia como zero', () => {
    expect(sumCents([])).toBe(0);
  });
});
