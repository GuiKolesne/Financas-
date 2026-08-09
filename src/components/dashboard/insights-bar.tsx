import type { Insight, InsightSeverity } from '@/lib/insights';

/**
 * As frases levam o significado sozinhas — a cor é reforço, nunca o único
 * sinal. Cada aviso traz também uma palavra de estado no início, para quem
 * não distingue as cores.
 */
const ESTILO: Record<InsightSeverity, { caixa: string; rotulo: string }> = {
  danger: {
    caixa: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200',
    rotulo: 'Atenção',
  },
  warning: {
    caixa: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
    rotulo: 'Fique de olho',
  },
  success: {
    caixa: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200',
    rotulo: 'Boa',
  },
  info: {
    caixa: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    rotulo: 'Dica',
  },
};

export function InsightsBar({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <ul className="space-y-2">
      {insights.map((i) => {
        const estilo = ESTILO[i.severity];
        return (
          <li
            key={i.id}
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${estilo.caixa}`}
          >
            <strong className="font-semibold">{estilo.rotulo}:</strong> {i.message}
          </li>
        );
      })}
    </ul>
  );
}
