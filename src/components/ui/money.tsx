import { formatBRL } from '@/lib/money';

/**
 * Todo valor monetário na tela passa por aqui. Centraliza a formatação e
 * garante que negativo apareça em vermelho de forma consistente.
 */
export function Money({
  cents,
  colorBySign = false,
  className = '',
}: {
  cents: number;
  colorBySign?: boolean;
  className?: string;
}) {
  const cor = !colorBySign
    ? ''
    : cents < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return <span className={`tabular-nums ${cor} ${className}`}>{formatBRL(cents)}</span>;
}
