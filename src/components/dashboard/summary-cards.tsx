import { Money } from '@/components/ui/money';
import { Explain } from '@/components/ui/explain';
import type { DashboardData } from '@/queries/dashboard';

function Cartao({
  titulo,
  cents,
  explicacao,
  colorBySign = false,
}: {
  titulo: string;
  cents: number;
  explicacao: string;
  colorBySign?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {titulo}
        <Explain>{explicacao}</Explain>
      </p>
      {/* Proporcional, não tabular: number grande com tabular-nums fica frouxo. */}
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <Money cents={cents} colorBySign={colorBySign} />
      </p>
    </div>
  );
}

export function SummaryCards({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cartao
          titulo="Receitas"
          cents={data.incomeCents}
          explicacao="Tudo que entrou até hoje neste mês."
        />
        <Cartao
          titulo="Despesas"
          cents={data.expenseCents}
          explicacao="Tudo que saiu até hoje neste mês, contando cada parcela no mês em que ela vence — e não a compra inteira no mês em que foi feita."
        />
        <Cartao
          titulo="Saldo atual"
          cents={data.balanceCents}
          colorBySign
          explicacao="Receitas menos despesas até hoje."
        />
        <Cartao
          titulo="Saldo previsto"
          cents={data.forecastCents}
          colorBySign
          explicacao="Estimativa de como o mês termina: o saldo de hoje, mais as contas que costumam se repetir e ainda não foram lançadas, menos as despesas já marcadas para os próximos dias. É uma projeção, não uma certeza."
        />
      </div>

      {data.committedCents > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Comprometido com parcelas futuras
            <Explain>
              Soma das parcelas que vencem depois deste mês. Esse dinheiro já está
              prometido, mesmo sem ter saído da conta ainda.
            </Explain>
          </p>
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
            <Money cents={data.committedCents} />
          </p>
        </div>
      )}
    </div>
  );
}
