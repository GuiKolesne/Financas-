'use client';

import { useState } from 'react';
import { simulate } from '@/lib/simulator';
import { invoiceMonthFor, dueDateFor } from '@/lib/billing-cycle';
import { MoneyInput } from '@/components/ui/money-input';
import { SimulatorResult } from './simulator-result';
import type { CreditCard } from '@/lib/types';

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const rotulo = 'mb-1 block text-sm text-slate-700 dark:text-slate-300';

/** Atalhos de rendimento que cobrem os casos comuns no Brasil. */
const TAXAS = [
  { valor: 0.1, nome: '0,10%', dica: 'poupança' },
  { valor: 0.9, nome: '0,90%', dica: 'CDI' },
  { valor: 1.2, nome: '1,20%', dica: 'mais agressivo' },
];

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-09-27" → "27/09". */
function diaMes(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

/** Dias entre a compra e o vencimento da primeira parcela. */
function diasDeCarencia(purchaseDate: string, primeiroVencimento: string): number {
  const ms = Date.parse(`${primeiroVencimento}T00:00:00Z`) - Date.parse(`${purchaseDate}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * Quantos meses o dinheiro rende antes da primeira parcela sair.
 *
 * É a vantagem que o app tem sobre uma calculadora genérica: em vez de pedir
 * a carência, ele deduz do ciclo do cartão que a pessoa já cadastrou.
 *
 * O simulador compõe juros mês a mês, então a carência vira um inteiro. Meio
 * mês de diferença some no arredondamento — por isso a tela mostra também a
 * data e a quantidade de dias, que é o que a pessoa realmente sente.
 */
function carenciaEmMeses(dias: number): number {
  return Math.max(1, Math.round(dias / 30));
}

export function SimulatorForm({ cards }: { cards: CreditCard[] }) {
  const [precoCents, setPrecoCents] = useState(0);
  const [parcelas, setParcelas] = useState(10);
  const [parcelaCents, setParcelaCents] = useState(0);
  const [taxa, setTaxa] = useState(0.9);
  const [cartaoId, setCartaoId] = useState('');
  const [data, setData] = useState(hojeISO());

  const cartao = cards.find((c) => c.id === cartaoId) ?? null;

  const primeiroVencimento = cartao
    ? (() => {
        const f = invoiceMonthFor(data, cartao.closingDay);
        return dueDateFor(f.year, f.month, cartao.closingDay, cartao.dueDay);
      })()
    : null;

  const dias = primeiroVencimento ? diasDeCarencia(data, primeiroVencimento) : 0;
  const carencia = primeiroVencimento ? carenciaEmMeses(dias) : 1;

  // Sem useMemo: `simulate` é um punhado de multiplicações e o compilador do
  // React já memoiza sozinho. O memo manual só atrapalhava essa análise.
  const resultado =
    precoCents > 0 && parcelaCents > 0
      ? simulate({
          cashPriceCents: precoCents,
          installmentsCount: parcelas,
          installmentAmountCents: parcelaCents,
          monthlyRatePercent: taxa,
          graceMonths: carencia,
        })
      : null;

  const paraLancar = new URLSearchParams({
    valor: String(parcelaCents * parcelas),
    parcelas: String(parcelas),
    ...(cartaoId ? { cartao: cartaoId, data } : {}),
  }).toString();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="sim-preco" className={rotulo}>
            Preço à vista (PIX ou débito)
          </label>
          <MoneyInput id="sim-preco" name="preco" onCentsChange={setPrecoCents} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sim-parcelas" className={rotulo}>
              Em quantas vezes
            </label>
            <input
              id="sim-parcelas"
              type="number"
              min={1}
              max={24}
              value={parcelas}
              onChange={(e) => setParcelas(Math.max(1, Number(e.target.value) || 1))}
              className={campo}
            />
          </div>

          <div>
            <label htmlFor="sim-parcela" className={rotulo}>
              Valor de cada parcela
            </label>
            <MoneyInput
              id="sim-parcela"
              name="parcela"
              valueCents={parcelaCents}
              onCentsChange={setParcelaCents}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setParcelaCents(Math.round(precoCents / parcelas))}
          disabled={precoCents <= 0}
          className="text-sm text-slate-600 underline underline-offset-4 disabled:opacity-50 dark:text-slate-400"
        >
          Preencher com o preço dividido igualmente
        </button>

        <fieldset>
          <legend className={rotulo}>Quanto seu dinheiro rende por mês</legend>
          <div className="flex flex-wrap gap-2">
            {TAXAS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTaxa(t.valor)}
                aria-pressed={taxa === t.valor}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  taxa === t.valor
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                {t.nome} <span className="opacity-70">({t.dica})</span>
              </button>
            ))}
            <input
              type="number"
              step="0.01"
              min={0}
              value={taxa}
              onChange={(e) => setTaxa(Math.max(0, Number(e.target.value) || 0))}
              aria-label="Outra taxa mensal, em porcentagem"
              className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </fieldset>

        <div>
          <label htmlFor="sim-cartao" className={rotulo}>
            Cartão (opcional)
          </label>
          <select
            id="sim-cartao"
            value={cartaoId}
            onChange={(e) => setCartaoId(e.target.value)}
            className={campo}
          >
            <option value="">Não usar cartão</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname}
              </option>
            ))}
          </select>
        </div>

        {cartao && (
          <>
            <div>
              <label htmlFor="sim-data" className={rotulo}>
                Data da compra
              </label>
              <input
                id="sim-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={campo}
              />
            </div>

            {primeiroVencimento && (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Comprando nesta data no {cartao.nickname}, a primeira parcela só sai em{' '}
                <strong>{diaMes(primeiroVencimento)}</strong> — são{' '}
                <strong>{dias} dias</strong> com o dinheiro ainda rendendo. Comprar logo
                depois do fechamento (dia {cartao.closingDay}) estica esse prazo.
              </p>
            )}
          </>
        )}
      </form>

      <div>
        {resultado ? (
          <SimulatorResult resultado={resultado} paraLancar={paraLancar} />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Preencha o preço à vista e o valor da parcela para ver a comparação.
          </p>
        )}
      </div>
    </div>
  );
}
