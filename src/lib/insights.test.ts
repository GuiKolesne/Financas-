import { describe, it, expect } from 'vitest';
import { buildInsights, budgetColor } from './insights';
import type { BudgetStatus } from './types';

function budget(over: Partial<BudgetStatus> = {}): BudgetStatus {
  return {
    categoryId: 'lazer',
    categoryName: 'Lazer e Entretenimento',
    categoryEmoji: '🎬',
    limitCents: 50000,
    spentCents: 0,
    ...over,
  };
}

const base = {
  budgets: [] as BudgetStatus[],
  dayOfMonth: 15,
  daysInMonth: 31,
  totalIncomeCents: 500000,
  totalExpenseCents: 200000,
  transactionCount: 10,
};

describe('budgetColor', () => {
  it('devolve none quando nao ha teto definido', () => {
    expect(budgetColor(10000, null)).toBe('none');
  });

  it('e verde em zero por cento', () => {
    expect(budgetColor(0, 50000)).toBe('green');
  });

  it('e verde logo abaixo de 70 por cento', () => {
    expect(budgetColor(34999, 50000)).toBe('green');
  });

  it('e amarelo exatamente em 70 por cento', () => {
    expect(budgetColor(35000, 50000)).toBe('yellow');
  });

  it('e amarelo logo abaixo de 100 por cento', () => {
    expect(budgetColor(49999, 50000)).toBe('yellow');
  });

  it('e vermelho exatamente em 100 por cento', () => {
    expect(budgetColor(50000, 50000)).toBe('red');
  });

  it('e vermelho acima de 100 por cento', () => {
    expect(budgetColor(60000, 50000)).toBe('red');
  });

  it('teto zero com gasto zero e vermelho', () => {
    expect(budgetColor(0, 0)).toBe('red');
  });
});

describe('buildInsights — orcamento estourado', () => {
  it('avisa quanto passou do teto', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 62000, limitCents: 50000 })],
    });

    expect(r[0].severity).toBe('danger');
    expect(r[0].message).toContain('🎬 Lazer e Entretenimento');
    expect(r[0].message).toContain('R$ 120,00');
  });
});

describe('buildInsights — orcamento em risco', () => {
  it('avisa quando o ritmo esta adiantado', () => {
    // 80% do teto gasto, mas só 48% do mês percorrido.
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 40000, limitCents: 50000 })],
      dayOfMonth: 15,
      daysInMonth: 31,
    });

    const risco = r.find((i) => i.severity === 'warning');
    expect(risco).toBeDefined();
    expect(risco!.message).toContain('80%');
    expect(risco!.message).toContain('🎬 Lazer e Entretenimento');
    expect(risco!.message).toContain('16 dias');
  });

  it('nao avisa quando o gasto acompanha o ritmo do mes', () => {
    // 71% do teto gasto com 90% do mês percorrido: está no ritmo.
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 35500, limitCents: 50000 })],
      dayOfMonth: 28,
      daysInMonth: 31,
    });

    expect(r.find((i) => i.severity === 'warning')).toBeUndefined();
  });

  it('nao avisa abaixo de 70 por cento', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 30000, limitCents: 50000 })],
      dayOfMonth: 2,
      daysInMonth: 31,
    });

    expect(r.find((i) => i.severity === 'warning')).toBeUndefined();
  });

  it('ignora categoria sem teto definido', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 999999, limitCents: null })],
    });

    expect(r.find((i) => i.severity === 'danger')).toBeUndefined();
    expect(r.find((i) => i.severity === 'warning')).toBeUndefined();
  });
});

describe('buildInsights — resultado do mes', () => {
  it('avisa quando as despesas passam as receitas', () => {
    const r = buildInsights({
      ...base,
      totalIncomeCents: 200000,
      totalExpenseCents: 250000,
    });

    const alerta = r.find((i) => i.message.includes('gastou mais do que ganhou'));
    expect(alerta).toBeDefined();
    expect(alerta!.severity).toBe('danger');
    expect(alerta!.message).toContain('R$ 500,00');
  });

  it('elogia quando guardou 20 por cento ou mais', () => {
    const r = buildInsights({
      ...base,
      totalIncomeCents: 500000,
      totalExpenseCents: 400000,
    });

    const elogio = r.find((i) => i.severity === 'success');
    expect(elogio).toBeDefined();
    expect(elogio!.message).toContain('20%');
  });

  it('nao elogia quando guardou menos de 20 por cento', () => {
    const r = buildInsights({
      ...base,
      totalIncomeCents: 500000,
      totalExpenseCents: 450000,
    });

    expect(r.find((i) => i.severity === 'success')).toBeUndefined();
  });

  it('nao divide por zero quando nao ha receita', () => {
    const r = buildInsights({ ...base, totalIncomeCents: 0, totalExpenseCents: 0, transactionCount: 1 });
    expect(r.every((i) => !i.message.includes('NaN'))).toBe(true);
  });
});

describe('buildInsights — mes vazio', () => {
  it('convida a comecar quando nao ha nenhum lancamento', () => {
    const r = buildInsights({
      ...base,
      transactionCount: 0,
      totalIncomeCents: 0,
      totalExpenseCents: 0,
    });

    expect(r).toHaveLength(1);
    expect(r[0].severity).toBe('info');
    expect(r[0].message).toContain('Nenhum lançamento');
  });
});

describe('buildInsights — ordenacao e limite', () => {
  it('mostra no maximo tres avisos', () => {
    const r = buildInsights({
      ...base,
      budgets: [
        budget({ categoryId: 'a', categoryName: 'A', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'b', categoryName: 'B', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'c', categoryName: 'C', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'd', categoryName: 'D', spentCents: 60000, limitCents: 50000 }),
      ],
    });

    expect(r).toHaveLength(3);
  });

  it('coloca o mais grave primeiro', () => {
    const r = buildInsights({
      ...base,
      budgets: [budget({ spentCents: 40000, limitCents: 50000 })],
      totalIncomeCents: 200000,
      totalExpenseCents: 250000,
      dayOfMonth: 15,
      daysInMonth: 31,
    });

    expect(r[0].severity).toBe('danger');
  });

  it('cada aviso tem um id unico', () => {
    const r = buildInsights({
      ...base,
      budgets: [
        budget({ categoryId: 'a', categoryName: 'A', spentCents: 60000, limitCents: 50000 }),
        budget({ categoryId: 'b', categoryName: 'B', spentCents: 60000, limitCents: 50000 }),
      ],
    });

    expect(new Set(r.map((i) => i.id)).size).toBe(r.length);
  });
});
