import { describe, it, expect } from 'vitest';
import { rowToCategory, rowToCard, rowToTransaction, rowToBudget } from './mappers';

describe('rowToCategory', () => {
  it('traduz snake_case do banco para o dominio', () => {
    expect(
      rowToCategory({
        id: 'c1', name: 'Supermercado', emoji: '🛒', color: '#10b981',
        type: 'expense', is_archived: false,
      }),
    ).toEqual({
      id: 'c1', name: 'Supermercado', emoji: '🛒', color: '#10b981',
      type: 'expense', isArchived: false,
    });
  });
});

describe('rowToCard', () => {
  it('traduz os dias do ciclo e o limite', () => {
    expect(
      rowToCard({
        id: 'k1', nickname: 'Nubank', brand: 'mastercard', limit_cents: 500000,
        closing_day: 20, due_day: 27, color: '#7c3aed',
      }),
    ).toEqual({
      id: 'k1', nickname: 'Nubank', brand: 'mastercard', limitCents: 500000,
      closingDay: 20, dueDay: 27, color: '#7c3aed',
    });
  });
});

describe('rowToTransaction', () => {
  it('traduz um lancamento simples', () => {
    expect(
      rowToTransaction({
        id: 't1', date: '2026-08-10', amount_cents: 12345, type: 'expense',
        category_id: 'c1', description: 'Padaria', payment_method: 'pix',
        credit_card_id: null, installment_plan_id: null, installment_number: null,
        is_recurring: false,
      }),
    ).toEqual({
      id: 't1', date: '2026-08-10', amountCents: 12345, type: 'expense',
      categoryId: 'c1', description: 'Padaria', paymentMethod: 'pix',
      creditCardId: null, installmentPlanId: null, installmentNumber: null,
      isRecurring: false,
    });
  });

  it('traduz uma parcela mantendo plano e numero', () => {
    const t = rowToTransaction({
      id: 't2', date: '2026-09-27', amount_cents: 30000, type: 'expense',
      category_id: 'c1', description: 'TV', payment_method: 'credit',
      credit_card_id: 'k1', installment_plan_id: 'p1', installment_number: 2,
      is_recurring: false,
    });

    expect(t.installmentPlanId).toBe('p1');
    expect(t.installmentNumber).toBe(2);
    expect(t.creditCardId).toBe('k1');
  });
});

describe('rowToBudget', () => {
  it('traduz o teto e o mes', () => {
    expect(
      rowToBudget({ id: 'b1', category_id: 'c1', month: '2026-08-01', limit_cents: 50000 }),
    ).toEqual({ id: 'b1', categoryId: 'c1', month: '2026-08-01', limitCents: 50000 });
  });
});
