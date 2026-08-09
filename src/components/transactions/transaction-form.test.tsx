import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionForm } from './transaction-form';
import type { Category, CreditCard } from '@/lib/types';

// A Server Action não roda em teste de componente: capturamos o FormData que
// o formulário monta, que é exatamente o contrato entre tela e servidor.
const enviado = vi.fn();

vi.mock('@/app/(app)/transacoes/actions', () => ({
  createTransaction: async (_prev: unknown, formData: FormData) => {
    enviado(Object.fromEntries(formData));
    return { error: null };
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const categorias: Category[] = [
  { id: 'cat-lazer', name: 'Lazer e Entretenimento', emoji: '🎬', color: '#8b5cf6', type: 'expense', isArchived: false },
  { id: 'cat-mercado', name: 'Supermercado', emoji: '🛒', color: '#10b981', type: 'expense', isArchived: false },
  { id: 'cat-salario', name: 'Salário', emoji: '💼', color: '#16a34a', type: 'income', isArchived: false },
];

const cartoes: CreditCard[] = [
  { id: 'k1', nickname: 'Nubank roxinho', brand: 'mastercard', limitCents: 500000, closingDay: 20, dueDay: 27, color: '#7c3aed' },
];

function montar() {
  return render(<TransactionForm categories={categorias} cards={cartoes} />);
}

beforeEach(() => enviado.mockClear());

describe('TransactionForm — abrir e fechar', () => {
  it('comeca fechado, mostrando so o botao de novo lancamento', () => {
    montar();

    expect(screen.getByRole('button', { name: 'Novo lançamento' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre o painel ao clicar no botao +', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Novo lançamento')).toBeInTheDocument();
  });

  it('fecha o painel no X', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));
    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('TransactionForm — tipo e categorias', () => {
  it('comeca em Despesa e lista so categorias de despesa', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    expect(screen.getByRole('button', { name: 'Despesa' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('option', { name: /Lazer e Entretenimento/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Salário/ })).not.toBeInTheDocument();
  });

  it('trocar para Receita troca a lista de categorias', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));
    await user.click(screen.getByRole('button', { name: 'Receita' }));

    expect(screen.getByRole('option', { name: /Salário/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Supermercado/ })).not.toBeInTheDocument();
  });
});

describe('TransactionForm — credito e parcelamento', () => {
  it('cartao e parcelas so aparecem no credito', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    expect(screen.queryByLabelText('Cartão')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crédito' }));

    expect(screen.getByText('Cartão')).toBeInTheDocument();
    expect(screen.getByText('Em quantas vezes')).toBeInTheDocument();
  });

  it('mostra a previa das parcelas com os valores certos', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    await user.type(screen.getByLabelText('Valor'), '300000');
    await user.click(screen.getByRole('button', { name: 'Crédito' }));
    await user.selectOptions(screen.getByLabelText('Cartão'), 'k1');

    const parcelas = screen.getByLabelText('Em quantas vezes');
    await user.clear(parcelas);
    await user.type(parcelas, '10');

    expect(await screen.findByText(/10x de R\$ 300,00/)).toBeInTheDocument();
    expect(await screen.findByText(/primeira em/)).toBeInTheDocument();
  });

  it('o checkbox de repeticao some quando ha mais de uma parcela', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    expect(screen.getByRole('checkbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crédito' }));
    const parcelas = screen.getByLabelText('Em quantas vezes');
    await user.clear(parcelas);
    await user.type(parcelas, '3');

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

describe('TransactionForm — o que e enviado ao servidor', () => {
  it('envia tipo e forma de pagamento escolhidos', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    await user.type(screen.getByLabelText('Valor'), '5000');
    await user.click(screen.getByRole('button', { name: 'Crédito' }));
    await user.selectOptions(screen.getByLabelText('Cartão'), 'k1');
    await user.click(screen.getByRole('button', { name: 'Salvar lançamento' }));

    await waitFor(() => expect(enviado).toHaveBeenCalled());

    const dados = enviado.mock.calls[0][0];
    expect(dados.type).toBe('expense');
    expect(dados.payment_method).toBe('credit');
    expect(dados.credit_card_id).toBe('k1');
  });

  it('envia credit_card_id vazio quando nao e credito', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }));

    await user.type(screen.getByLabelText('Valor'), '4550');
    await user.click(screen.getByRole('button', { name: 'Salvar lançamento' }));

    await waitFor(() => expect(enviado).toHaveBeenCalled());

    const dados = enviado.mock.calls[0][0];
    expect(dados.payment_method).toBe('pix');
    expect(dados.credit_card_id).toBe('');
    expect(dados.amount).toBe('45,50');
  });
});
