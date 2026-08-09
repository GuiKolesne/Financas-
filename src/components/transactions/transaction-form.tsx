'use client';

import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createTransaction, type ActionState } from '@/app/(app)/transacoes/actions';
import { MoneyInput } from '@/components/ui/money-input';
import { InstallmentPreview } from './installment-preview';
import type { Category, CreditCard, PaymentMethod, TransactionType } from '@/lib/types';

const estadoInicial: ActionState = { error: null };

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const rotulo = 'mb-1 block text-sm text-slate-700 dark:text-slate-300';

const FORMAS: { valor: PaymentMethod; nome: string }[] = [
  { valor: 'pix', nome: 'PIX' },
  { valor: 'debit', nome: 'Débito' },
  { valor: 'cash', nome: 'Dinheiro' },
  { valor: 'credit', nome: 'Crédito' },
];

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  categories,
  cards,
}: {
  categories: Category[];
  cards: CreditCard[];
}) {
  const params = useSearchParams();
  const [estado, salvar, salvando] = useActionState(createTransaction, estadoInicial);

  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TransactionType>('expense');
  const [forma, setForma] = useState<PaymentMethod>('pix');
  const [cartaoId, setCartaoId] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [valorCents, setValorCents] = useState(0);
  const [data, setData] = useState(hojeISO());

  // Vindo do simulador com "Lançar essa compra": abre já preenchido.
  useEffect(() => {
    const valor = params.get('valor');
    if (!valor) return;

    setValorCents(Number(valor));
    setParcelas(Number(params.get('parcelas') ?? 1));
    setData(params.get('data') ?? hojeISO());

    const cartao = params.get('cartao');
    if (cartao) {
      setCartaoId(cartao);
      setForma('credit');
    }
    setAberto(true);
  }, [params]);

  // Salvou sem erro: fecha o painel e limpa para o próximo lançamento.
  useEffect(() => {
    if (salvando) return;
    if (estado.error === null && aberto) {
      setAberto(false);
      setValorCents(0);
      setParcelas(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const doTipo = categories.filter((c) => c.type === tipo);
  const cartaoEscolhido = cards.find((c) => c.id === cartaoId) ?? null;
  const noCredito = forma === 'credit';

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-20 right-5 z-30 h-14 w-14 rounded-full bg-slate-900 text-2xl text-white shadow-lg md:bottom-8 md:right-8 dark:bg-slate-100 dark:text-slate-900"
        aria-label="Novo lançamento"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Novo lançamento
          </h2>
          <button
            onClick={() => setAberto(false)}
            className="text-slate-500 dark:text-slate-400"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form action={salvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={tipo === t}
                className={`rounded-lg border py-2.5 font-medium ${
                  tipo === t
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                {t === 'expense' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={tipo} />

          {/* Rótulo associado por id: o MoneyInput tem um "R$" decorativo
              dentro, e um <label> que envolve o campo acabaria virando o nome
              "Valor R$" para quem usa leitor de tela. */}
          <div>
            <label htmlFor="campo-valor" className={rotulo}>
              Valor
            </label>
            <MoneyInput
              id="campo-valor"
              name="amount"
              defaultCents={valorCents}
              onCentsChange={setValorCents}
            />
          </div>

          <label>
            <span className={rotulo}>Data</span>
            <input
              name="date"
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={campo}
            />
          </label>

          <label>
            <span className={rotulo}>Categoria</span>
            <select name="category_id" required className={campo}>
              {doTipo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className={rotulo}>Forma de pagamento</legend>
            <div className="grid grid-cols-4 gap-2">
              {FORMAS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => {
                    setForma(f.valor);
                    if (f.valor !== 'credit') setParcelas(1);
                  }}
                  aria-pressed={forma === f.valor}
                  className={`rounded-lg border py-2 text-sm ${
                    forma === f.valor
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {f.nome}
                </button>
              ))}
            </div>
          </fieldset>
          <input type="hidden" name="payment_method" value={forma} />

          {noCredito && (
            <>
              <label>
                <span className={rotulo}>Cartão</span>
                <select
                  name="credit_card_id"
                  required
                  value={cartaoId}
                  onChange={(e) => setCartaoId(e.target.value)}
                  className={campo}
                >
                  <option value="">Escolha o cartão</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nickname}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={rotulo}>Em quantas vezes</span>
                <input
                  name="installments_count"
                  type="number"
                  min={1}
                  max={24}
                  value={parcelas}
                  onChange={(e) => setParcelas(Number(e.target.value))}
                  className={campo}
                />
              </label>

              <InstallmentPreview
                totalCents={valorCents}
                count={parcelas}
                purchaseDate={data}
                card={cartaoEscolhido}
              />
            </>
          )}
          {!noCredito && <input type="hidden" name="credit_card_id" value="" />}

          <label>
            <span className={rotulo}>Descrição</span>
            <input
              name="description"
              maxLength={120}
              placeholder="Ex: Mercado da esquina"
              className={campo}
            />
          </label>

          {parcelas === 1 && (
            <label className="flex items-center gap-2">
              <input name="is_recurring" type="checkbox" className="h-4 w-4" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Repete todo mês
              </span>
            </label>
          )}

          {estado.error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {estado.error}
            </p>
          )}

          <button
            disabled={salvando}
            className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {salvando ? 'Salvando…' : 'Salvar lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
