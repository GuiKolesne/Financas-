'use client';

import { useState } from 'react';
import { formatBRLCompact, parseBRL } from '@/lib/money';

/**
 * Campo que só aceita formato brasileiro. Reformata a cada tecla, então o
 * texto enviado ao servidor é sempre o que `parseBRL` sabe ler.
 */
export function MoneyInput({
  name,
  defaultCents = 0,
  required = true,
  id,
  onCentsChange,
}: {
  name: string;
  defaultCents?: number;
  required?: boolean;
  id?: string;
  /** Avisa o formulário-pai a cada mudança, para prévias em tempo real. */
  onCentsChange?: (cents: number) => void;
}) {
  const [texto, setTexto] = useState(defaultCents ? formatBRLCompact(defaultCents) : '');

  function aoDigitar(bruto: string) {
    const cents = parseBRL(bruto);
    setTexto(bruto === '' ? '' : formatBRLCompact(cents));
    onCentsChange?.(cents);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        R$
      </span>
      <input
        id={id}
        name={name}
        required={required}
        inputMode="decimal"
        value={texto}
        onChange={(e) => aoDigitar(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-right tabular-nums
                   dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}
