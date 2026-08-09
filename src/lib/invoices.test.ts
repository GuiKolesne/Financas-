import { describe, it, expect } from 'vitest';
import { groupIntoInvoices, currentAndNext } from './invoices';
import type { Transaction } from './types';

function tx(date: string, amountCents: number): Transaction {
  return {
    id: `${date}-${amountCents}`,
    date,
    amountCents,
    type: 'expense',
    categoryId: 'c1',
    description: '',
    paymentMethod: 'credit',
    creditCardId: 'k1',
    installmentPlanId: null,
    installmentNumber: null,
    isRecurring: false,
  };
}

describe('groupIntoInvoices', () => {
  it('junta lancamentos com o mesmo vencimento numa fatura so', () => {
    const faturas = groupIntoInvoices([
      tx('2026-08-27', 10000),
      tx('2026-08-27', 5000),
      tx('2026-09-27', 30000),
    ]);

    expect(faturas).toHaveLength(2);
    expect(faturas[0].dueDate).toBe('2026-08-27');
    expect(faturas[0].totalCents).toBe(15000);
    expect(faturas[0].transactions).toHaveLength(2);
    expect(faturas[1].totalCents).toBe(30000);
  });

  it('devolve as faturas em ordem de vencimento', () => {
    const faturas = groupIntoInvoices([
      tx('2026-10-27', 100),
      tx('2026-08-27', 100),
      tx('2026-09-27', 100),
    ]);

    expect(faturas.map((f) => f.dueDate)).toEqual([
      '2026-08-27', '2026-09-27', '2026-10-27',
    ]);
  });

  it('lista vazia nao gera fatura', () => {
    expect(groupIntoInvoices([])).toEqual([]);
  });
});

describe('currentAndNext', () => {
  const faturas = groupIntoInvoices([
    tx('2026-07-27', 10000),
    tx('2026-08-27', 20000),
    tx('2026-09-27', 30000),
  ]);

  it('a atual e a primeira que ainda nao venceu', () => {
    const { current, next } = currentAndNext(faturas, '2026-08-10');
    expect(current?.dueDate).toBe('2026-08-27');
    expect(next?.dueDate).toBe('2026-09-27');
  });

  it('a fatura que vence hoje ainda e a atual', () => {
    const { current } = currentAndNext(faturas, '2026-08-27');
    expect(current?.dueDate).toBe('2026-08-27');
  });

  it('sem fatura futura, atual e proxima sao nulas', () => {
    const { current, next } = currentAndNext(faturas, '2026-12-01');
    expect(current).toBeNull();
    expect(next).toBeNull();
  });

  it('sem faturas nenhuma, devolve nulos', () => {
    const { current, next } = currentAndNext([], '2026-08-10');
    expect(current).toBeNull();
    expect(next).toBeNull();
  });

  it('havendo uma unica fatura futura, a proxima e nula', () => {
    const { current, next } = currentAndNext(faturas, '2026-09-01');
    expect(current?.dueDate).toBe('2026-09-27');
    expect(next).toBeNull();
  });
});
