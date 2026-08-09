import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetBar } from './budget-bar';
import type { BudgetStatus } from '@/lib/types';

function status(over: Partial<BudgetStatus> = {}): BudgetStatus {
  return {
    categoryId: 'lazer',
    categoryName: 'Lazer e Entretenimento',
    categoryEmoji: '🎬',
    limitCents: 50000,
    spentCents: 0,
    ...over,
  };
}

/** A cor mora na classe do preenchimento da barra. */
function corDaBarra(container: HTMLElement): string | null {
  const preenchimento = container.querySelector('[role="progressbar"] > div');
  if (!preenchimento) return null;

  const classes = preenchimento.className;
  if (classes.includes('bg-emerald-500')) return 'verde';
  if (classes.includes('bg-amber-500')) return 'amarelo';
  if (classes.includes('bg-red-500')) return 'vermelho';
  return 'desconhecida';
}

describe('BudgetBar — os seis limites de cor', () => {
  it('zero por cento e verde', () => {
    const { container } = render(<BudgetBar status={status({ spentCents: 0 })} />);
    expect(corDaBarra(container)).toBe('verde');
  });

  it('logo abaixo de 70 por cento ainda e verde', () => {
    const { container } = render(<BudgetBar status={status({ spentCents: 34999 })} />);
    expect(corDaBarra(container)).toBe('verde');
  });

  it('exatamente 70 por cento vira amarelo', () => {
    const { container } = render(<BudgetBar status={status({ spentCents: 35000 })} />);
    expect(corDaBarra(container)).toBe('amarelo');
  });

  it('logo abaixo de 100 por cento ainda e amarelo', () => {
    const { container } = render(<BudgetBar status={status({ spentCents: 49999 })} />);
    expect(corDaBarra(container)).toBe('amarelo');
  });

  it('exatamente 100 por cento vira vermelho', () => {
    const { container } = render(<BudgetBar status={status({ spentCents: 50000 })} />);
    expect(corDaBarra(container)).toBe('vermelho');
  });

  it('acima de 100 por cento continua vermelho', () => {
    const { container } = render(<BudgetBar status={status({ spentCents: 62000 })} />);
    expect(corDaBarra(container)).toBe('vermelho');
  });
});

describe('BudgetBar — categoria sem teto', () => {
  it('nao desenha barra nenhuma', () => {
    const { container } = render(
      <BudgetBar status={status({ limitCents: null, spentCents: 12345 })} />,
    );

    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('diz que nao ha teto, em vez de sugerir teto zero', () => {
    render(<BudgetBar status={status({ limitCents: null, spentCents: 12345 })} />);

    expect(screen.getByText(/sem teto definido/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 123,45/)).toBeInTheDocument();
  });
});

describe('BudgetBar — estouro', () => {
  it('mostra quanto passou do teto', () => {
    render(<BudgetBar status={status({ spentCents: 62000 })} />);

    expect(screen.getByText(/R\$ 120,00 acima do teto/)).toBeInTheDocument();
  });

  it('nao fala em estouro quando esta dentro do teto', () => {
    render(<BudgetBar status={status({ spentCents: 40000 })} />);

    expect(screen.queryByText(/acima do teto/)).not.toBeInTheDocument();
  });

  it('a barra nao passa de 100 por cento mesmo estourando', () => {
    render(<BudgetBar status={status({ spentCents: 200000 })} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('BudgetBar — acessibilidade', () => {
  it('a barra se identifica pela categoria', () => {
    render(<BudgetBar status={status({ spentCents: 25000 })} />);

    expect(
      screen.getByRole('progressbar', { name: 'Orçamento de Lazer e Entretenimento' }),
    ).toBeInTheDocument();
  });

  it('anuncia a porcentagem gasta', () => {
    render(<BudgetBar status={status({ spentCents: 25000 })} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });
});
