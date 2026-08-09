'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatBRL } from '@/lib/money';
import type { CategorySlice } from '@/queries/dashboard';

/**
 * Onde o dinheiro foi parar no mês. No máximo 6 fatias — a consulta já
 * agrupa a cauda em "Outras categorias".
 *
 * A legenda abaixo lista nome e valor de cada fatia: é a tabela do gráfico.
 * Nenhum dado depende só da cor, e o tooltip só enriquece.
 */
export function CategoryPie({ slices }: { slices: CategorySlice[] }) {
  if (slices.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhuma despesa neste mês.
      </p>
    );
  }

  const total = slices.reduce((s, f) => s + f.valueCents, 0);

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="valueCents"
              nameKey="label"
              innerRadius="52%"
              outerRadius="82%"
              // 2px de respiro entre fatias, em vez de borda desenhada.
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((f) => (
                <Cell key={f.categoryId} fill={f.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatBRL(Number(v ?? 0))}
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 space-y-1.5">
        {slices.map((f) => (
          <li key={f.categoryId} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: f.color }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
              {f.label}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
              {total > 0 ? Math.round((f.valueCents / total) * 100) : 0}%
            </span>
            <span className="shrink-0 tabular-nums text-slate-900 dark:text-slate-100">
              {formatBRL(f.valueCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
