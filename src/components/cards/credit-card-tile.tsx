import Link from 'next/link';
import { Money } from '@/components/ui/money';
import type { CreditCard } from '@/lib/types';

/**
 * O cartão como a pessoa o reconhece: apelido, o que já entrou na fatura
 * atual, o que já está formando a próxima, e quando fecha e vence.
 */
export function CreditCardTile({
  card,
  currentInvoiceCents,
  nextInvoiceCents,
}: {
  card: CreditCard;
  currentInvoiceCents: number;
  nextInvoiceCents: number;
}) {
  const disponivel = card.limitCents - currentInvoiceCents;
  const usoDoLimite =
    card.limitCents > 0 ? Math.min(currentInvoiceCents / card.limitCents, 1) : 0;

  return (
    <Link
      href={`/cartoes/${card.id}`}
      className="block rounded-xl p-4 text-white shadow-sm transition hover:brightness-110"
      style={{ backgroundColor: card.color }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">{card.nickname}</span>
        {card.brand && <span className="text-xs uppercase opacity-80">{card.brand}</span>}
      </div>

      <dl className="mt-4 space-y-1">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm opacity-90">Fatura atual</dt>
          <dd className="text-xl font-semibold">
            <Money cents={currentInvoiceCents} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm opacity-90">Próxima fatura</dt>
          <dd className="text-sm opacity-90">
            <Money cents={nextInvoiceCents} />
          </dd>
        </div>
      </dl>

      {card.limitCents > 0 && (
        <div className="mt-3">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/25"
            role="progressbar"
            aria-valuenow={Math.round(usoDoLimite * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Uso do limite"
          >
            <div className="h-full bg-white/90" style={{ width: `${usoDoLimite * 100}%` }} />
          </div>
          <p className="mt-1 text-xs opacity-90">
            Disponível: <Money cents={disponivel} />
          </p>
        </div>
      )}

      <p className="mt-3 text-xs opacity-80">
        Fecha dia {card.closingDay} · vence dia {card.dueDay}
      </p>
    </Link>
  );
}
