import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstallmentPreview } from './installment-preview';
import type { CreditCard } from '@/lib/types';

const cartao: CreditCard = {
  id: 'k1',
  nickname: 'Nubank roxinho',
  brand: 'mastercard',
  limitCents: 500000,
  closingDay: 20,
  dueDay: 27,
  color: '#7c3aed',
};

describe('InstallmentPreview', () => {
  it('mostra a TV de R$ 3.000 em 10x com a primeira e a ultima parcela', () => {
    render(
      <InstallmentPreview
        totalCents={300000}
        count={10}
        purchaseDate="2026-08-05"
        card={cartao}
      />,
    );

    expect(screen.getByText(/10x de R\$ 300,00/)).toBeInTheDocument();
    expect(screen.getByText(/primeira em 27\/08\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/última em 27\/05\/2027/)).toBeInTheDocument();
  });

  it('explica o arredondamento quando a divisao nao e exata', () => {
    render(
      <InstallmentPreview totalCents={10000} count={3} purchaseDate="2026-08-05" card={cartao} />,
    );

    expect(screen.getByText(/a primeira sai R\$ 33,34 e as outras R\$ 33,33/)).toBeInTheDocument();
    expect(screen.getByText(/somar exatamente|bater exatamente R\$ 100,00|R\$ 100,00/)).toBeInTheDocument();
  });

  it('nao repete a explicacao de arredondamento quando a divisao e exata', () => {
    render(
      <InstallmentPreview totalCents={300000} count={10} purchaseDate="2026-08-05" card={cartao} />,
    );

    expect(screen.queryByText(/A divisão não é exata/)).not.toBeInTheDocument();
  });

  it('avisa que cada parcela conta no mes em que vence', () => {
    render(
      <InstallmentPreview totalCents={300000} count={10} purchaseDate="2026-08-05" card={cartao} />,
    );

    expect(
      screen.getByText(/Cada parcela vai contar no mês em que vence/),
    ).toBeInTheDocument();
  });

  it('compra depois do fechamento adia a primeira parcela para setembro', () => {
    render(
      <InstallmentPreview totalCents={300000} count={10} purchaseDate="2026-08-21" card={cartao} />,
    );

    expect(screen.getByText(/primeira em 27\/09\/2026/)).toBeInTheDocument();
  });

  it('nao aparece sem cartao escolhido', () => {
    const { container } = render(
      <InstallmentPreview totalCents={300000} count={10} purchaseDate="2026-08-05" card={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('nao aparece em compra a vista', () => {
    const { container } = render(
      <InstallmentPreview totalCents={300000} count={1} purchaseDate="2026-08-05" card={cartao} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('nao aparece com valor zerado', () => {
    const { container } = render(
      <InstallmentPreview totalCents={0} count={10} purchaseDate="2026-08-05" card={cartao} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
