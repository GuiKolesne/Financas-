import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryPie } from './category-pie';
import type { CategorySlice } from '@/queries/dashboard';

const fatias: CategorySlice[] = [
  { categoryId: 'a', label: '🏠 Moradia', color: '#2a78d6', valueCents: 150000 },
  { categoryId: 'b', label: '🛒 Supermercado', color: '#d95926', valueCents: 50000 },
];

describe('CategoryPie — a legenda e a tabela do grafico', () => {
  it('lista cada fatia com nome, porcentagem e valor', () => {
    render(<CategoryPie slices={fatias} />);

    expect(screen.getByText('🏠 Moradia')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    expect(screen.getByText('🛒 Supermercado')).toBeInTheDocument();
    expect(screen.getByText('R$ 500,00')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('todo valor e legivel sem passar o mouse', () => {
    render(<CategoryPie slices={fatias} />);

    // Este é o requisito: o tooltip enriquece, nunca é o único caminho.
    for (const f of fatias) {
      expect(screen.getByText(f.label)).toBeInTheDocument();
    }
  });

  it('nao divide por zero quando tudo e zero', () => {
    render(
      <CategoryPie
        slices={[{ categoryId: 'z', label: 'Nada', color: '#2a78d6', valueCents: 0 }]}
      />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('CategoryPie — mes sem despesa', () => {
  it('diz que nao ha despesa, em vez de desenhar um grafico vazio', () => {
    render(<CategoryPie slices={[]} />);

    expect(screen.getByText('Nenhuma despesa neste mês.')).toBeInTheDocument();
  });
});
