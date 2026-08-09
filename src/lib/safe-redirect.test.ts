import { describe, it, expect } from 'vitest';
import { safeInternalPath } from './safe-redirect';

describe('safeInternalPath — caminhos legítimos', () => {
  it('aceita um caminho interno simples', () => {
    expect(safeInternalPath('/redefinir-senha')).toBe('/redefinir-senha');
  });

  it('aceita caminho com query', () => {
    expect(safeInternalPath('/transacoes?mes=2026-08-01')).toBe('/transacoes?mes=2026-08-01');
  });

  it('cai na raiz quando nao vem nada', () => {
    expect(safeInternalPath(null)).toBe('/');
  });

  it('cai na raiz com string vazia', () => {
    expect(safeInternalPath('')).toBe('/');
  });
});

describe('safeInternalPath — tentativas de mandar a pessoa para fora', () => {
  it('recusa endereco absoluto', () => {
    expect(safeInternalPath('https://site-malicioso.com')).toBe('/');
  });

  it('recusa barra dupla, que o navegador le como outro dominio', () => {
    expect(safeInternalPath('//site-malicioso.com')).toBe('/');
  });

  it('recusa barra dupla com contrabarra', () => {
    expect(safeInternalPath('/\\site-malicioso.com')).toBe('/');
  });

  it('recusa javascript:', () => {
    expect(safeInternalPath('javascript:alert(1)')).toBe('/');
  });

  it('recusa caminho que nao comeca com barra', () => {
    expect(safeInternalPath('transacoes')).toBe('/');
  });

  it('recusa esquema de dados', () => {
    expect(safeInternalPath('data:text/html,<script>')).toBe('/');
  });
});
