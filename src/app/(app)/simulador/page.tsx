import { listCards } from '@/queries/cards';
import { SimulatorForm } from '@/components/simulator/simulator-form';

export default async function SimuladorPage() {
  const cartoes = await listCards();

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Vale a pena parcelar?
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Compare pagar de uma vez com parcelar deixando o dinheiro rendendo. O
          simulador considera até a folga que o cartão te dá antes da primeira
          parcela — quanto mais perto do fechamento você compra, mais tempo o
          dinheiro fica aplicado. Nada aqui é gravado: é só uma conta para ajudar
          na decisão.
        </p>
      </header>

      <SimulatorForm cards={cartoes} />
    </div>
  );
}
