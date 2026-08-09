'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatBRL } from '@/lib/money';
import { monthLabel } from '@/lib/month';
import type { MonthlyBalance } from '@/queries/dashboard';

const ABREVIADO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function mesCurto(monthISO: string): string {
  return ABREVIADO[Number(monthISO.slice(5, 7)) - 1];
}

/** R$ 7.454,50 → "7,5 mil"; valores pequenos ficam em reais cheios. */
function eixoY(cents: number): string {
  const reais = cents / 100;
  if (Math.abs(reais) >= 1000) {
    return `${(reais / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }
  return reais.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

/**
 * Saldo mês a mês. Uma série só, então não precisa de legenda: o título do
 * cartão já diz o que a linha é. A linha de referência no zero é o que
 * separa mês positivo de mês negativo à primeira vista.
 */
export function BalanceLine({ points }: { points: MonthlyBalance[] }) {
  const dados = points.map((p) => ({
    mes: mesCurto(p.monthISO),
    mesPorExtenso: monthLabel(p.monthISO),
    saldo: p.balanceCents,
  }));

  const temMovimento = dados.some((d) => d.saldo !== 0);

  if (!temMovimento) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Ainda não há meses com movimento para comparar.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          {/* Grade discreta e sólida: tracejado leria como projeção. */}
          <CartesianGrid stroke="currentColor" strokeWidth={1} vertical={false} className="text-slate-200 dark:text-slate-800" />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            className="text-slate-500"
          />
          <YAxis
            tickFormatter={eixoY}
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 12 }}
            className="text-slate-500"
          />
          <ReferenceLine y={0} stroke="currentColor" className="text-slate-400" strokeWidth={1} />
          <Tooltip
            formatter={(v) => [formatBRL(Number(v ?? 0)), 'Saldo']}
            labelFormatter={(_, carga) => carga?.[0]?.payload?.mesPorExtenso ?? ''}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
