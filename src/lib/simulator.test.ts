import { describe, it, expect } from 'vitest';
import { simulate } from './simulator';

const base = {
  cashPriceCents: 100000,
  installmentsCount: 10,
  installmentAmountCents: 10000,
  monthlyRatePercent: 0,
  graceMonths: 1,
};

describe('simulate — totais', () => {
  it('soma o total parcelado', () => {
    expect(simulate(base).installmentTotalCents).toBe(100000);
  });

  it('calcula a diferenca entre parcelado e a vista', () => {
    const r = simulate({ ...base, installmentAmountCents: 11000 });
    expect(r.installmentTotalCents).toBe(110000);
    expect(r.differenceCents).toBe(10000);
  });
});

describe('simulate — sem rendimento', () => {
  it('parcelado sem juros e sem rendimento empata com a vista', () => {
    const r = simulate(base);
    expect(r.finalBalanceCents).toBe(0);
    expect(r.betterOption).toBe('tie');
  });

  it('parcelado mais caro sem rendimento perde para a vista', () => {
    const r = simulate({ ...base, installmentAmountCents: 11000 });
    expect(r.finalBalanceCents).toBe(-10000);
    expect(r.betterOption).toBe('cash');
  });

  it('nao ha ganho de investimento quando a taxa e zero', () => {
    expect(simulate(base).investmentGainCents).toBe(0);
  });
});

describe('simulate — com rendimento', () => {
  it('parcelado sem juros com dinheiro rendendo ganha da a vista', () => {
    const r = simulate({ ...base, monthlyRatePercent: 0.9 });
    expect(r.finalBalanceCents).toBeGreaterThan(0);
    expect(r.betterOption).toBe('installments');
  });

  it('rendimento maior produz saldo final maior', () => {
    const baixo = simulate({ ...base, monthlyRatePercent: 0.5 });
    const alto = simulate({ ...base, monthlyRatePercent: 1.5 });
    expect(alto.finalBalanceCents).toBeGreaterThan(baixo.finalBalanceCents);
  });

  it('carencia maior produz saldo final maior', () => {
    const curta = simulate({ ...base, monthlyRatePercent: 0.9, graceMonths: 1 });
    const longa = simulate({ ...base, monthlyRatePercent: 0.9, graceMonths: 2 });
    expect(longa.finalBalanceCents).toBeGreaterThan(curta.finalBalanceCents);
  });

  it('o ganho de investimento e positivo quando ha taxa', () => {
    expect(simulate({ ...base, monthlyRatePercent: 0.9 }).investmentGainCents)
      .toBeGreaterThan(0);
  });
});

describe('simulate — juros embutidos', () => {
  it('nao ha juros embutido quando o total parcelado iguala o a vista', () => {
    expect(simulate(base).implicitMonthlyRatePercent).toBe(0);
  });

  it('nao ha juros embutido quando o parcelado e mais barato', () => {
    const r = simulate({ ...base, installmentAmountCents: 9000 });
    expect(r.implicitMonthlyRatePercent).toBe(0);
  });

  it('uma parcela de 110 sobre 100 a vista da exatamente 10% ao mes', () => {
    const r = simulate({
      cashPriceCents: 100000,
      installmentsCount: 1,
      installmentAmountCents: 110000,
      monthlyRatePercent: 0,
      graceMonths: 1,
    });
    expect(r.implicitMonthlyRatePercent).toBeCloseTo(10, 2);
  });

  it('converte a taxa mensal para anual com juros compostos', () => {
    const r = simulate({
      cashPriceCents: 100000,
      installmentsCount: 1,
      installmentAmountCents: 110000,
      monthlyRatePercent: 0,
      graceMonths: 1,
    });
    // (1,10)^12 - 1 = 213,84%
    expect(r.implicitAnnualRatePercent).toBeCloseTo(213.84, 1);
  });

  it('detecta juros embutido em parcelamento longo mais caro', () => {
    const r = simulate({ ...base, installmentsCount: 12, installmentAmountCents: 10000 });
    expect(r.implicitMonthlyRatePercent).toBeGreaterThan(2);
    expect(r.implicitMonthlyRatePercent).toBeLessThan(4);
  });
});

describe('simulate — veredito', () => {
  it('explica em portugues quando parcelar e melhor', () => {
    const r = simulate({ ...base, monthlyRatePercent: 0.9 });
    expect(r.verdict).toContain('Parcelar');
    expect(r.verdict).toContain('R$');
  });

  it('explica em portugues quando a vista e melhor', () => {
    const r = simulate({ ...base, installmentAmountCents: 11000 });
    expect(r.verdict).toContain('à vista');
  });

  it('explica o empate', () => {
    expect(simulate(base).verdict).toContain('mesmo');
  });
});

describe('simulate — validacao', () => {
  it('rejeita numero de parcelas menor que um', () => {
    expect(() => simulate({ ...base, installmentsCount: 0 })).toThrow();
  });

  it('rejeita carencia menor que um', () => {
    expect(() => simulate({ ...base, graceMonths: 0 })).toThrow();
  });

  it('rejeita preco a vista negativo', () => {
    expect(() => simulate({ ...base, cashPriceCents: -1 })).toThrow();
  });
});
