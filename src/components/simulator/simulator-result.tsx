import Link from 'next/link';
import { formatBRL } from '@/lib/money';
import { Money } from '@/components/ui/money';
import { Explain } from '@/components/ui/explain';
import type { SimulatorResult as Resultado } from '@/lib/simulator';

const VEREDITO: Record<Resultado['betterOption'], string> = {
  installments:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200',
  cash: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
  tie: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
};

function Linha({
  rotulo,
  cents,
  explicacao,
  colorBySign = false,
}: {
  rotulo: string;
  cents: number;
  explicacao?: string;
  colorBySign?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-slate-600 dark:text-slate-400">
        {rotulo}
        {explicacao && <Explain>{explicacao}</Explain>}
      </dt>
      <dd className="tabular-nums text-slate-900 dark:text-slate-100">
        <Money cents={cents} colorBySign={colorBySign} />
      </dd>
    </div>
  );
}

export function SimulatorResult({
  resultado,
  paraLancar,
}: {
  resultado: Resultado;
  /** Query string já montada para abrir o formulário preenchido. */
  paraLancar: string;
}) {
  const semJuros = resultado.implicitMonthlyRatePercent < 0.01;

  return (
    <div className="space-y-4">
      <p
        role="status"
        className={`rounded-xl border px-4 py-3 font-medium ${VEREDITO[resultado.betterOption]}`}
      >
        {resultado.verdict}
      </p>

      <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-800">
        <Linha rotulo="Total à vista" cents={resultado.cashTotalCents} />
        <Linha rotulo="Total parcelado" cents={resultado.installmentTotalCents} />
        <Linha
          rotulo="Diferença"
          cents={resultado.differenceCents}
          colorBySign
          explicacao="Quanto o parcelado custa a mais em reais, sem contar o rendimento do dinheiro."
        />
        <Linha
          rotulo="Rendimento no período"
          cents={resultado.investmentGainCents}
          explicacao="Quanto seu dinheiro rende enquanto você vai pagando as parcelas."
        />
      </dl>

      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">
          Juros escondidos no parcelamento
        </h3>

        {semJuros ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Não há juros embutido: o total parcelado é igual ou menor que o preço à vista.
          </p>
        ) : (
          <>
            <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
              <span className="text-slate-900 dark:text-slate-100">
                <strong className="text-lg">
                  {resultado.implicitMonthlyRatePercent.toLocaleString('pt-BR', {
                    maximumFractionDigits: 2,
                  })}
                  %
                </strong>{' '}
                <span className="text-sm text-slate-600 dark:text-slate-400">ao mês</span>
              </span>
              <span className="text-slate-900 dark:text-slate-100">
                <strong className="text-lg">
                  {resultado.implicitAnnualRatePercent.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })}
                  %
                </strong>{' '}
                <span className="text-sm text-slate-600 dark:text-slate-400">ao ano</span>
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Mesmo quando a loja diz &ldquo;sem juros&rdquo;, se o preço à vista é menor
              que o total das parcelas, existe juros embutido. Aqui ele é de{' '}
              {resultado.implicitMonthlyRatePercent.toLocaleString('pt-BR', {
                maximumFractionDigits: 2,
              })}
              % ao mês — o equivalente a pagar {formatBRL(resultado.differenceCents)} a mais
              pelo direito de parcelar.
            </p>
          </>
        )}
      </section>

      <Link
        href={`/transacoes?${paraLancar}`}
        className="inline-block rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
      >
        Lançar essa compra
      </Link>
    </div>
  );
}
