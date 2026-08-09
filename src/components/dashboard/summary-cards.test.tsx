import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from './summary-cards';
import type { DashboardData } from '@/queries/dashboard';

function dados(over: Partial<DashboardData> = {}): DashboardData {
  return {
    monthISO: '2026-08-01',
    incomeCents: 750000,
    expenseCents: 44550,
    balanceCents: 705450,
    forecastCents: 705450,
    committedCents: 0,
    insights: [],
    byCategory: [],
    monthlyBalances: [],
    ...over,
  };
}

describe('SummaryCards — os quatro numeros', () => {
  it('mostra receitas, despesas, saldo atual e previsto', () => {
    render(<SummaryCards data={dados()} />);

    expect(screen.getByText('R$ 7.500,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 445,50')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 7.054,50')).toHaveLength(2);
  });

  it('cada numero traz uma explicacao de onde ele saiu', () => {
    render(<SummaryCards data={dados()} />);

    const explicacoes = screen.getAllByRole('note');
    expect(explicacoes).toHaveLength(4);
    expect(explicacoes.every((e) => (e.getAttribute('aria-label') ?? '').length > 20)).toBe(true);
  });

  it('a explicacao de Despesas conta a regra das parcelas', () => {
    render(<SummaryCards data={dados()} />);

    const texto = screen
      .getAllByRole('note')
      .map((e) => e.getAttribute('aria-label') ?? '')
      .join(' ');

    expect(texto).toMatch(/parcela no mês em que ela vence/);
  });

  it('a explicacao do Saldo previsto avisa que e projecao', () => {
    render(<SummaryCards data={dados()} />);

    const texto = screen
      .getAllByRole('note')
      .map((e) => e.getAttribute('aria-label') ?? '')
      .join(' ');

    expect(texto).toMatch(/projeção, não uma certeza/);
  });
});

describe('SummaryCards — parcelas futuras', () => {
  it('mostra o comprometido quando ha parcelas a vencer', () => {
    render(<SummaryCards data={dados({ committedCents: 270000 })} />);

    expect(screen.getByText(/Comprometido com parcelas futuras/)).toBeInTheDocument();
    expect(screen.getByText('R$ 2.700,00')).toBeInTheDocument();
  });

  it('esconde a faixa quando nao ha parcela nenhuma', () => {
    render(<SummaryCards data={dados({ committedCents: 0 })} />);

    expect(screen.queryByText(/Comprometido com parcelas futuras/)).not.toBeInTheDocument();
  });
});
