import { describe, it, expect } from 'vitest';
import { balanceOf, pendingRecurring, forecastEndOfMonth, committedFutureCents } from './forecast';
import type { Transaction } from './types';

/** Constrói uma transação com os campos que os testes não usam já preenchidos. */
function tx(over: Partial<Transaction> & Pick<Transaction, 'amountCents' | 'type'>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-08-10',
    categoryId: 'cat-1',
    description: '',
    paymentMethod: 'pix',
    creditCardId: null,
    installmentPlanId: null,
    installmentNumber: null,
    isRecurring: false,
    ...over,
  };
}

describe('balanceOf', () => {
  it('soma receitas e subtrai despesas', () => {
    const t = [
      tx({ amountCents: 500000, type: 'income' }),
      tx({ amountCents: 150000, type: 'expense' }),
      tx({ amountCents: 60000, type: 'expense' }),
    ];
    expect(balanceOf(t)).toBe(290000);
  });

  it('lista vazia da saldo zero', () => {
    expect(balanceOf([])).toBe(0);
  });

  it('so despesas da saldo negativo', () => {
    expect(balanceOf([tx({ amountCents: 10000, type: 'expense' })])).toBe(-10000);
  });
});

describe('pendingRecurring', () => {
  it('aponta a recorrente do mes passado que ainda nao foi lancada', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];
    const atual: Transaction[] = [];

    const pendentes = pendingRecurring(anterior, atual);
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].categoryId).toBe('moradia');
  });

  it('ignora a recorrente que ja foi lancada neste mes', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(0);
  });

  it('ignora a recorrente ja lancada mesmo com data no futuro do mes', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true, date: '2026-07-05' }),
    ];
    const atual = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true, date: '2026-08-28' }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(0);
  });

  it('nao considera transacoes que nao sao recorrentes', () => {
    const anterior = [
      tx({ amountCents: 60000, type: 'expense', categoryId: 'mercado', isRecurring: false }),
    ];
    expect(pendingRecurring(anterior, [])).toHaveLength(0);
  });

  it('valor diferente na mesma categoria conta como pendente', () => {
    const anterior = [
      tx({ amountCents: 150000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 160000, type: 'expense', categoryId: 'moradia', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(1);
  });

  it('conta por multiconjunto quando ha recorrentes identicas', () => {
    const anterior = [
      tx({ amountCents: 5000, type: 'expense', categoryId: 'assinaturas', isRecurring: true }),
      tx({ amountCents: 5000, type: 'expense', categoryId: 'assinaturas', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 5000, type: 'expense', categoryId: 'assinaturas', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(1);
  });

  it('distingue receita de despesa de mesmo valor e categoria', () => {
    const anterior = [
      tx({ amountCents: 5000, type: 'income', categoryId: 'x', isRecurring: true }),
    ];
    const atual = [
      tx({ amountCents: 5000, type: 'expense', categoryId: 'x', isRecurring: true }),
    ];

    expect(pendingRecurring(anterior, atual)).toHaveLength(1);
  });
});

describe('forecastEndOfMonth', () => {
  it('soma receitas pendentes e subtrai despesas pendentes e futuras', () => {
    const previsto = forecastEndOfMonth({
      currentBalanceCents: 290000,
      pending: [
        tx({ amountCents: 100000, type: 'income', isRecurring: true }),
        tx({ amountCents: 30000, type: 'expense', isRecurring: true }),
      ],
      futureThisMonthCents: 50000,
    });

    expect(previsto).toBe(290000 + 100000 - 30000 - 50000);
  });

  it('sem pendentes e sem futuras o previsto e o saldo atual', () => {
    expect(
      forecastEndOfMonth({ currentBalanceCents: 12345, pending: [], futureThisMonthCents: 0 }),
    ).toBe(12345);
  });

  it('pode ficar negativo', () => {
    expect(
      forecastEndOfMonth({ currentBalanceCents: 10000, pending: [], futureThisMonthCents: 30000 }),
    ).toBe(-20000);
  });
});

describe('committedFutureCents', () => {
  it('soma as parcelas com vencimento depois do fim do mes', () => {
    const t = [
      tx({ amountCents: 30000, type: 'expense', date: '2026-08-27', installmentPlanId: 'p1' }),
      tx({ amountCents: 30000, type: 'expense', date: '2026-09-27', installmentPlanId: 'p1' }),
      tx({ amountCents: 30000, type: 'expense', date: '2026-10-27', installmentPlanId: 'p1' }),
    ];

    expect(committedFutureCents(t, '2026-08-31')).toBe(60000);
  });

  it('ignora transacoes que nao sao parcelas', () => {
    const t = [
      tx({ amountCents: 99999, type: 'expense', date: '2026-12-01', installmentPlanId: null }),
    ];
    expect(committedFutureCents(t, '2026-08-31')).toBe(0);
  });

  it('devolve zero quando nao ha parcela futura', () => {
    expect(committedFutureCents([], '2026-08-31')).toBe(0);
  });
});
