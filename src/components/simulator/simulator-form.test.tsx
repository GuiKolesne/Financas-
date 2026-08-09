import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimulatorForm } from './simulator-form';
import type { CreditCard } from '@/lib/types';

const cartoes: CreditCard[] = [
  {
    id: 'k1',
    nickname: 'Nubank roxinho',
    brand: 'mastercard',
    limitCents: 500000,
    closingDay: 20,
    dueDay: 27,
    color: '#7c3aed',
  },
];

/** Preenche preço à vista e valor da parcela, em centavos digitados. */
async function preencher(
  user: ReturnType<typeof userEvent.setup>,
  precoDigitos: string,
  parcelaDigitos: string,
) {
  await user.type(screen.getByLabelText(/Preço à vista/), precoDigitos);
  await user.type(screen.getByLabelText('Valor de cada parcela'), parcelaDigitos);
}

describe('SimulatorForm — estado inicial', () => {
  it('pede os dados antes de mostrar qualquer conta', () => {
    render(<SimulatorForm cards={cartoes} />);

    expect(screen.getByText(/Preencha o preço à vista/)).toBeInTheDocument();
  });

  it('comeca com a taxa do CDI marcada', () => {
    render(<SimulatorForm cards={cartoes} />);

    expect(screen.getByRole('button', { name: /0,90%/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('SimulatorForm — o veredito', () => {
  it('parcelado sem juros com dinheiro rendendo favorece parcelar', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    // R$ 1.000,00 à vista contra 10x de R$ 100,00
    await preencher(user, '100000', '10000');

    expect(await screen.findByText(/Parcelar é melhor/)).toBeInTheDocument();
  });

  it('parcelado mais caro sem rendimento favorece pagar a vista', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await user.click(screen.getByRole('button', { name: /0,10%/ }));
    await preencher(user, '100000', '12000');

    expect(await screen.findByText(/Pagar à vista é melhor/)).toBeInTheDocument();
  });

  it('mostra os totais dos dois caminhos', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await preencher(user, '100000', '10000');

    expect(await screen.findByText('Total à vista')).toBeInTheDocument();
    expect(screen.getByText('Total parcelado')).toBeInTheDocument();
  });
});

describe('SimulatorForm — juros escondidos', () => {
  it('avisa quando nao ha juros embutido', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await preencher(user, '100000', '10000');

    expect(await screen.findByText(/Não há juros embutido/)).toBeInTheDocument();
  });

  it('mostra a taxa ao mes e ao ano quando o parcelado e mais caro', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await preencher(user, '100000', '12000');

    expect(await screen.findByText('ao mês')).toBeInTheDocument();
    expect(screen.getByText('ao ano')).toBeInTheDocument();
    expect(screen.getByText(/loja diz/)).toBeInTheDocument();
  });
});

describe('SimulatorForm — carencia deduzida do cartao', () => {
  it('sem cartao escolhido nao fala em carencia', () => {
    render(<SimulatorForm cards={cartoes} />);

    expect(screen.queryByText(/a primeira parcela só sai em/)).not.toBeInTheDocument();
  });

  it('escolhendo o cartao, explica quando a primeira parcela sai', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await user.selectOptions(screen.getByLabelText('Cartão (opcional)'), 'k1');

    expect(await screen.findByText(/a primeira parcela só sai em/)).toBeInTheDocument();
  });

  it('comprar depois do fechamento estica o prazo ate a primeira parcela', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await user.selectOptions(screen.getByLabelText('Cartão (opcional)'), 'k1');

    const data = screen.getByLabelText('Data da compra');
    await user.clear(data);
    await user.type(data, '2026-08-21');

    // Fechou dia 20, então a compra entra na fatura de setembro, que vence 27/09.
    expect(await screen.findByText('27/09')).toBeInTheDocument();
    expect(screen.getByText('37 dias')).toBeInTheDocument();
  });

  it('comprar antes do fechamento da um prazo bem menor', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await user.selectOptions(screen.getByLabelText('Cartão (opcional)'), 'k1');

    const data = screen.getByLabelText('Data da compra');
    await user.clear(data);
    await user.type(data, '2026-08-05');

    // Entra na fatura de agosto, que vence 27/08: só 22 dias.
    expect(await screen.findByText('27/08')).toBeInTheDocument();
    expect(screen.getByText('22 dias')).toBeInTheDocument();
  });
});

describe('SimulatorForm — atalho de divisao', () => {
  it('preenche a parcela com o preco dividido igualmente', async () => {
    const user = userEvent.setup();
    render(<SimulatorForm cards={cartoes} />);

    await user.type(screen.getByLabelText(/Preço à vista/), '100000');
    await user.click(screen.getByRole('button', { name: /dividido igualmente/ }));

    expect((screen.getByLabelText('Valor de cada parcela') as HTMLInputElement).value).toBe('100,00');
  });
});
