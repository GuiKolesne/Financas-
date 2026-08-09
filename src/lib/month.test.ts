import { describe, it, expect } from 'vitest';
import { monthRange, currentMonthISO, shiftMonth, monthLabel } from './month';

describe('monthRange', () => {
  it('vai do dia 1 ao ultimo dia do mes', () => {
    expect(monthRange('2026-08-01')).toEqual({ start: '2026-08-01', end: '2026-08-31' });
  });

  it('respeita fevereiro em ano comum', () => {
    expect(monthRange('2026-02-01')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('respeita fevereiro em ano bissexto', () => {
    expect(monthRange('2028-02-01')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });

  it('respeita meses de 30 dias', () => {
    expect(monthRange('2026-04-01')).toEqual({ start: '2026-04-01', end: '2026-04-30' });
  });
});

describe('currentMonthISO', () => {
  it('normaliza qualquer data para o dia 1 do mes', () => {
    expect(currentMonthISO('2026-08-17')).toBe('2026-08-01');
  });

  it('mantem o dia 1 que ja veio normalizado', () => {
    expect(currentMonthISO('2026-08-01')).toBe('2026-08-01');
  });
});

describe('shiftMonth', () => {
  it('avanca um mes', () => {
    expect(shiftMonth('2026-08-01', 1)).toBe('2026-09-01');
  });

  it('volta um mes', () => {
    expect(shiftMonth('2026-08-01', -1)).toBe('2026-07-01');
  });

  it('vira o ano para frente', () => {
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('vira o ano para tras', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
  });

  it('anda doze meses de uma vez', () => {
    expect(shiftMonth('2026-08-01', -11)).toBe('2025-09-01');
  });
});

describe('monthLabel', () => {
  it('escreve o mes por extenso em portugues', () => {
    expect(monthLabel('2026-08-01')).toBe('agosto de 2026');
  });

  it('escreve marco com cedilha', () => {
    expect(monthLabel('2026-03-01')).toBe('março de 2026');
  });
});
