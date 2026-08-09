import { listCards } from '@/queries/cards';
import { CreditCardTile } from '@/components/cards/credit-card-tile';
import { CardForm } from '@/components/cards/card-form';

export default async function CartoesPage() {
  const cartoes = await listCards();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cartões</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Cadastre seus cartões para lançar compras parceladas e acompanhar as faturas.
        </p>
      </header>

      {cartoes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Você ainda não cadastrou nenhum cartão. Cadastre um para lançar compras
          parceladas e ver suas faturas.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {cartoes.map((c) => (
            <li key={c.id}>
              {/* As faturas de verdade chegam na Tarefa 17. */}
              <CreditCardTile card={c} currentInvoiceCents={0} nextInvoiceCents={0} />
            </li>
          ))}
        </ul>
      )}

      <CardForm />
    </div>
  );
}
