'use client';

import { generateInstallments } from '@/lib/installments';
import { formatBRL } from '@/lib/money';
import type { CreditCard } from '@/lib/types';

/** "2026-08-27" → "27/08/2026". */
function porExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Mostra exatamente o que vai ser gravado antes de gravar.
 *
 * É o antídoto para o susto: a pessoa compra R$ 3.000 em 10x e vê aqui que o
 * app vai lançar R$ 300 por mês, começando na fatura certa — em vez de
 * descobrir isso depois, olhando um número que não bate com o que esperava.
 */
export function InstallmentPreview({
  totalCents,
  count,
  purchaseDate,
  card,
}: {
  totalCents: number;
  count: number;
  purchaseDate: string;
  card: CreditCard | null;
}) {
  if (!card || count < 2 || totalCents <= 0) return null;

  const parcelas = generateInstallments({
    totalCents,
    count,
    purchaseDate,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
  });

  const primeira = parcelas[0];
  const ultima = parcelas[parcelas.length - 1];
  const arredondouDiferente = primeira.amountCents !== parcelas[1].amountCents;

  return (
    <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-900">
      <p className="text-slate-800 dark:text-slate-200">
        <strong>
          {count}x de {formatBRL(arredondouDiferente ? parcelas[1].amountCents : primeira.amountCents)}
        </strong>{' '}
        — primeira em {porExtenso(primeira.dueDate)}, última em {porExtenso(ultima.dueDate)}.
      </p>

      {arredondouDiferente && (
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          A divisão não é exata: a primeira sai {formatBRL(primeira.amountCents)} e as
          outras {formatBRL(parcelas[1].amountCents)}, para a soma bater exatamente{' '}
          {formatBRL(totalCents)}.
        </p>
      )}

      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Cada parcela vai contar no mês em que vence, não tudo de uma vez agora.
      </p>
    </div>
  );
}
