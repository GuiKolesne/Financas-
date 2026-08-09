import { describe, it, expect } from 'vitest';
import { checkPassword, MIN_SENHA } from './password';

const email = 'guilherme@gmail.com';

describe('checkPassword — tamanho', () => {
  it('recusa senha curta demais', () => {
    expect(checkPassword('Abc12345', email)).toBe(
      `A senha precisa de pelo menos ${MIN_SENHA} caracteres.`,
    );
  });

  it('aceita exatamente no limite', () => {
    expect(checkPassword('MinhaGrana26', email)).toBeNull();
  });
});

describe('checkPassword — variedade', () => {
  it('recusa so letras', () => {
    expect(checkPassword('minhagrandesenha', email)).toBe(
      'Misture letras e números na senha.',
    );
  });

  it('recusa so numeros', () => {
    expect(checkPassword('123456789012', email)).toBe(
      'Misture letras e números na senha.',
    );
  });

  it('aceita letras com numeros', () => {
    expect(checkPassword('cafedamanha7', email)).toBeNull();
  });

  it('aceita letras com simbolos', () => {
    expect(checkPassword('cafe-da-manha!', email)).toBeNull();
  });
});

describe('checkPassword — senhas obvias', () => {
  it('recusa sequencia de numeros embutida em senha com letras', () => {
    expect(checkPassword('banana123456', email)).toContain('fácil de adivinhar');
  });

  it('so digitos recebe o aviso de variedade, que e mais acionavel', () => {
    expect(checkPassword('123456789012345', email)).toBe(
      'Misture letras e números na senha.',
    );
  });

  it('recusa senha comum mesmo com maiuscula', () => {
    expect(checkPassword('Senha123456789', email)).toContain('fácil de adivinhar');
  });

  it('recusa quando contem a palavra senha', () => {
    expect(checkPassword('minhasenha2026', email)).toContain('fácil de adivinhar');
  });

  it('recusa quando contem password', () => {
    expect(checkPassword('mypassword2026', email)).toContain('fácil de adivinhar');
  });

  it('recusa qwerty', () => {
    expect(checkPassword('qwerty123456', email)).toContain('fácil de adivinhar');
  });
});

describe('checkPassword — relacao com o e-mail', () => {
  it('recusa a senha que contem o nome do e-mail', () => {
    expect(checkPassword('guilherme2026', 'guilherme@gmail.com')).toBe(
      'A senha não pode conter seu e-mail.',
    );
  });

  it('ignora maiusculas ao comparar com o e-mail', () => {
    expect(checkPassword('GUILHERME2026', 'guilherme@gmail.com')).toBe(
      'A senha não pode conter seu e-mail.',
    );
  });

  it('nao reclama de nome curto que aparece por acaso', () => {
    // Nomes de 3 letras ou menos gerariam falso positivo demais.
    expect(checkPassword('anacronismo42', 'ana@gmail.com')).toBeNull();
  });
});

describe('checkPassword — repeticao', () => {
  it('recusa o mesmo caractere repetido', () => {
    expect(checkPassword('aaaaaaaaaaaa1', email)).toContain('fácil de adivinhar');
  });
});

describe('checkPassword — casos que devem passar', () => {
  it.each([
    'Financas2026',
    'cafe-da-manha7',
    'MinhaGrana#26',
    'orcamento2026ok',
  ])('aceita %s', (senha) => {
    expect(checkPassword(senha, email)).toBeNull();
  });
});
