import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from './money-input';
import { parseBRL } from '@/lib/money';

function montar(props: Partial<Parameters<typeof MoneyInput>[0]> = {}) {
  const aoMudar = vi.fn();
  render(
    <>
      <label htmlFor="v">Valor</label>
      <MoneyInput id="v" name="amount" onCentsChange={aoMudar} {...props} />
    </>,
  );
  return { aoMudar, campo: screen.getByLabelText('Valor') as HTMLInputElement };
}

describe('MoneyInput — digitacao', () => {
  it('preenche a partir dos centavos, como no aplicativo do banco', async () => {
    const user = userEvent.setup();
    const { campo } = montar();

    await user.type(campo, '4');
    expect(campo.value).toBe('0,04');

    await user.type(campo, '5');
    expect(campo.value).toBe('0,45');

    await user.type(campo, '5');
    expect(campo.value).toBe('4,55');

    await user.type(campo, '0');
    expect(campo.value).toBe('45,50');
  });

  it('digitar 300000 vira tres mil reais com separador de milhar', async () => {
    const user = userEvent.setup();
    const { campo } = montar();

    await user.type(campo, '300000');

    expect(campo.value).toBe('3.000,00');
  });

  it('avisa o formulario-pai em centavos a cada tecla', async () => {
    const user = userEvent.setup();
    const { campo, aoMudar } = montar();

    await user.type(campo, '4550');

    expect(aoMudar).toHaveBeenLastCalledWith(4550);
  });

  it('ignora letras e simbolos, aproveitando so os digitos', async () => {
    const user = userEvent.setup();
    const { campo } = montar();

    await user.type(campo, 'R$ 12ab34');

    expect(campo.value).toBe('12,34');
  });

  it('apagar tudo volta para vazio', async () => {
    const user = userEvent.setup();
    const { campo, aoMudar } = montar();

    await user.type(campo, '4550');
    await user.clear(campo);

    expect(campo.value).toBe('');
    expect(aoMudar).toHaveBeenLastCalledWith(0);
  });

  it('nao aceita mais de onze digitos, para nao estourar a coluna do banco', async () => {
    const user = userEvent.setup();
    const { campo, aoMudar } = montar();

    await user.type(campo, '123456789012345');

    expect(aoMudar).toHaveBeenLastCalledWith(12345678901);
  });
});

describe('MoneyInput — contrato com o servidor', () => {
  it('o texto enviado e sempre legivel pelo parseBRL', async () => {
    const user = userEvent.setup();
    const { campo } = montar();

    await user.type(campo, '300000');

    // É este o contrato: o que a Server Action recebe volta ao mesmo número.
    expect(parseBRL(campo.value)).toBe(300000);
  });

  it('valor inicial aparece formatado', () => {
    const { campo } = montar({ defaultCents: 123456 });
    expect(campo.value).toBe('1.234,56');
  });

  it('valor inicial zero deixa o campo vazio', () => {
    const { campo } = montar({ defaultCents: 0 });
    expect(campo.value).toBe('');
  });
});
