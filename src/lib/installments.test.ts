import { describe, it, expect } from 'vitest';
import { splitAmount, generateInstallments } from './installments';
import { sumCents } from './money';

describe('splitAmount', () => {
  it('divide exatamente quando nao ha resto', () => {
    expect(splitAmount(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it('coloca o resto na primeira parcela', () => {
    expect(splitAmount(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it('a soma das parcelas e sempre igual ao total', () => {
    for (const total of [10000, 9999, 100, 1, 123457]) {
      for (const n of [2, 3, 4, 6, 7, 10, 12]) {
        expect(sumCents(splitAmount(total, n))).toBe(total);
      }
    }
  });

  it('trata uma parcela unica', () => {
    expect(splitAmount(9999, 1)).toEqual([9999]);
  });

  it('distribui valor menor que o numero de parcelas', () => {
    expect(splitAmount(2, 3)).toEqual([2, 0, 0]);
  });

  it('rejeita numero de parcelas menor que um', () => {
    expect(() => splitAmount(1000, 0)).toThrow();
  });

  it('rejeita total negativo', () => {
    expect(() => splitAmount(-1000, 3)).toThrow();
  });
});

describe('generateInstallments', () => {
  const cartao = { closingDay: 20, dueDay: 27 };

  it('gera a quantidade certa de parcelas numeradas a partir de 1', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 10,
      purchaseDate: '2026-08-05',
      ...cartao,
    });

    expect(parcelas).toHaveLength(10);
    expect(parcelas[0].number).toBe(1);
    expect(parcelas[9].number).toBe(10);
  });

  it('a primeira parcela vence na fatura correta', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 10,
      purchaseDate: '2026-08-05',
      ...cartao,
    });

    expect(parcelas[0].dueDate).toBe('2026-08-27');
    expect(parcelas[1].dueDate).toBe('2026-09-27');
  });

  it('compra depois do fechamento adia todas as parcelas em um mes', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 3,
      purchaseDate: '2026-08-21',
      ...cartao,
    });

    expect(parcelas.map((p) => p.dueDate)).toEqual([
      '2026-09-27',
      '2026-10-27',
      '2026-11-27',
    ]);
  });

  it('atravessa a virada de ano', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 4,
      purchaseDate: '2026-11-05',
      ...cartao,
    });

    expect(parcelas.map((p) => p.dueDate)).toEqual([
      '2026-11-27',
      '2026-12-27',
      '2027-01-27',
      '2027-02-27',
    ]);
  });

  it('encurta o dia de vencimento nos meses que nao tem aquele dia', () => {
    const parcelas = generateInstallments({
      totalCents: 300000,
      count: 3,
      purchaseDate: '2026-01-05',
      closingDay: 20,
      dueDay: 31,
    });

    expect(parcelas.map((p) => p.dueDate)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
  });

  it('a soma das parcelas geradas e igual ao total', () => {
    const parcelas = generateInstallments({
      totalCents: 10000,
      count: 3,
      purchaseDate: '2026-08-05',
      ...cartao,
    });

    expect(sumCents(parcelas.map((p) => p.amountCents))).toBe(10000);
    expect(parcelas[0].amountCents).toBe(3334);
  });
});
