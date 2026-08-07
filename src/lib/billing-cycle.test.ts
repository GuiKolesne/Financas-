import { describe, it, expect } from 'vitest';
import {
  lastDayOfMonth,
  clampDay,
  addMonths,
  invoiceMonthFor,
  dueDateFor,
  firstDueDateFor,
} from './billing-cycle';

describe('lastDayOfMonth', () => {
  it('conhece meses de 31 dias', () => {
    expect(lastDayOfMonth(2026, 1)).toBe(31);
  });

  it('conhece meses de 30 dias', () => {
    expect(lastDayOfMonth(2026, 4)).toBe(30);
  });

  it('conhece fevereiro em ano comum', () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
  });

  it('conhece fevereiro em ano bissexto', () => {
    expect(lastDayOfMonth(2028, 2)).toBe(29);
  });
});

describe('clampDay', () => {
  it('mantem o dia quando ele existe no mes', () => {
    expect(clampDay(2026, 1, 31)).toBe(31);
  });

  it('encurta o dia 31 para o ultimo dia de fevereiro', () => {
    expect(clampDay(2026, 2, 31)).toBe(28);
  });

  it('encurta o dia 31 para 30 em meses de 30 dias', () => {
    expect(clampDay(2026, 4, 31)).toBe(30);
  });
});

describe('addMonths', () => {
  it('avanca dentro do mesmo ano', () => {
    expect(addMonths(2026, 8, 1)).toEqual({ year: 2026, month: 9 });
  });

  it('vira o ano para frente', () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('vira o ano para tras', () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('avanca mais de doze meses', () => {
    expect(addMonths(2026, 8, 14)).toEqual({ year: 2027, month: 10 });
  });

  it('somar zero nao muda nada', () => {
    expect(addMonths(2026, 8, 0)).toEqual({ year: 2026, month: 8 });
  });
});

describe('invoiceMonthFor', () => {
  it('compra antes do fechamento entra na fatura do mes', () => {
    expect(invoiceMonthFor('2026-08-05', 20)).toEqual({ year: 2026, month: 8 });
  });

  it('compra no dia exato do fechamento entra na fatura seguinte', () => {
    expect(invoiceMonthFor('2026-08-20', 20)).toEqual({ year: 2026, month: 9 });
  });

  it('compra um dia antes do fechamento entra na fatura do mes', () => {
    expect(invoiceMonthFor('2026-08-19', 20)).toEqual({ year: 2026, month: 8 });
  });

  it('compra um dia depois do fechamento entra na fatura seguinte', () => {
    expect(invoiceMonthFor('2026-08-21', 20)).toEqual({ year: 2026, month: 9 });
  });

  it('vira o ano quando a compra e em dezembro depois do fechamento', () => {
    expect(invoiceMonthFor('2026-12-25', 20)).toEqual({ year: 2027, month: 1 });
  });

  it('cartao que fecha dia 31: compra em 28 de fevereiro cai na fatura seguinte', () => {
    // O fechamento encurta para 28, e a compra no dia 28 já é "no fechamento".
    expect(invoiceMonthFor('2026-02-28', 31)).toEqual({ year: 2026, month: 3 });
  });

  it('cartao que fecha dia 31: compra em 27 de fevereiro cai na fatura do mes', () => {
    expect(invoiceMonthFor('2026-02-27', 31)).toEqual({ year: 2026, month: 2 });
  });
});

describe('dueDateFor', () => {
  it('vence no mesmo mes quando o vencimento e depois do fechamento', () => {
    expect(dueDateFor(2026, 8, 20, 27)).toBe('2026-08-27');
  });

  it('vence no mes seguinte quando o vencimento e antes do fechamento', () => {
    expect(dueDateFor(2026, 8, 20, 10)).toBe('2026-09-10');
  });

  it('vence no mes seguinte quando vencimento e fechamento sao no mesmo dia', () => {
    expect(dueDateFor(2026, 8, 20, 20)).toBe('2026-09-20');
  });

  it('vira o ano quando a fatura de dezembro vence em janeiro', () => {
    expect(dueDateFor(2026, 12, 20, 10)).toBe('2027-01-10');
  });

  it('encurta o dia de vencimento que nao existe no mes', () => {
    expect(dueDateFor(2026, 1, 20, 31)).toBe('2026-01-31');
    expect(dueDateFor(2026, 2, 20, 31)).toBe('2026-02-28');
  });
});

describe('firstDueDateFor', () => {
  it('combina fatura de destino e vencimento', () => {
    // Compra em 05/08 num cartao que fecha 20 e vence 27:
    // entra na fatura de agosto, que vence em 27/08.
    expect(firstDueDateFor('2026-08-05', 20, 27)).toBe('2026-08-27');
  });

  it('compra depois do fechamento adia o primeiro vencimento', () => {
    expect(firstDueDateFor('2026-08-21', 20, 27)).toBe('2026-09-27');
  });
});
