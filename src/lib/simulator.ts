import { formatBRL } from './money';

export interface SimulatorInput {
  /** Preço à vista, no PIX ou débito. */
  cashPriceCents: number;
  installmentsCount: number;
  installmentAmountCents: number;
  /** Rendimento mensal da aplicação, em porcentagem. 0,9 significa 0,9% a.m. */
  monthlyRatePercent: number;
  /** Meses até a primeira parcela sair da conta. Mínimo 1. */
  graceMonths: number;
}

export interface SimulatorResult {
  cashTotalCents: number;
  installmentTotalCents: number;
  /** Quanto o parcelado custa a mais em reais nominais. */
  differenceCents: number;
  /** Quanto a aplicação rendeu durante o período. */
  investmentGainCents: number;
  /** O que sobra ao fim se você parcelar e aplicar. Positivo = parcelar ganhou. */
  finalBalanceCents: number;
  implicitMonthlyRatePercent: number;
  implicitAnnualRatePercent: number;
  betterOption: 'cash' | 'installments' | 'tie';
  verdict: string;
}

/** Valor presente das parcelas a uma taxa mensal `i`, considerando a carência. */
function presentValue(
  installmentCents: number,
  count: number,
  graceMonths: number,
  i: number,
): number {
  let total = 0;
  for (let k = 0; k < count; k++) {
    total += installmentCents / Math.pow(1 + i, graceMonths + k);
  }
  return total;
}

/**
 * Acha, por bisseção, a taxa mensal que faz o valor presente das parcelas
 * igualar o preço à vista. É o juro que está escondido no parcelamento.
 */
function implicitMonthlyRate(input: SimulatorInput): number {
  const { cashPriceCents, installmentsCount, installmentAmountCents, graceMonths } = input;

  const total = installmentAmountCents * installmentsCount;
  // Parcelado que não custa mais que o à vista não tem juros embutido.
  if (total <= cashPriceCents || cashPriceCents === 0) return 0;

  let baixo = 0;
  let alto = 1; // 100% ao mês é teto de sobra para qualquer parcelamento real

  for (let iteracao = 0; iteracao < 200; iteracao++) {
    const meio = (baixo + alto) / 2;
    const pv = presentValue(installmentAmountCents, installmentsCount, graceMonths, meio);
    // O valor presente cai conforme a taxa sobe.
    if (pv > cashPriceCents) baixo = meio;
    else alto = meio;
  }

  return (baixo + alto) / 2;
}

/** Compara pagar à vista com parcelar mantendo o dinheiro aplicado. */
export function simulate(input: SimulatorInput): SimulatorResult {
  const {
    cashPriceCents,
    installmentsCount,
    installmentAmountCents,
    monthlyRatePercent,
    graceMonths,
  } = input;

  if (!Number.isInteger(installmentsCount) || installmentsCount < 1) {
    throw new Error('O número de parcelas precisa ser um inteiro maior que zero.');
  }
  if (!Number.isInteger(graceMonths) || graceMonths < 1) {
    throw new Error('A carência precisa ser de pelo menos um mês.');
  }
  if (cashPriceCents < 0 || installmentAmountCents < 0) {
    throw new Error('Valores não podem ser negativos.');
  }

  const taxa = monthlyRatePercent / 100;
  const installmentTotalCents = installmentAmountCents * installmentsCount;

  // Simula o dinheiro aplicado sendo consumido parcela a parcela.
  let saldo = cashPriceCents;
  for (let k = 1; k <= installmentsCount; k++) {
    const mesesRendendo = k === 1 ? graceMonths : 1;
    saldo *= Math.pow(1 + taxa, mesesRendendo);
    saldo -= installmentAmountCents;
  }
  const finalBalanceCents = Math.round(saldo);

  // Sem aplicar, você terminaria com (à vista − total parcelado).
  const semAplicar = cashPriceCents - installmentTotalCents;
  const investmentGainCents = finalBalanceCents - semAplicar;

  const mensal = implicitMonthlyRate(input);
  const implicitMonthlyRatePercent = mensal * 100;
  const implicitAnnualRatePercent = (Math.pow(1 + mensal, 12) - 1) * 100;

  const betterOption: SimulatorResult['betterOption'] =
    finalBalanceCents > 0 ? 'installments' : finalBalanceCents < 0 ? 'cash' : 'tie';

  const verdict =
    betterOption === 'installments'
      ? `Parcelar é melhor: sobram ${formatBRL(finalBalanceCents)} se você aplicar o dinheiro a ${monthlyRatePercent}% ao mês.`
      : betterOption === 'cash'
        ? `Pagar à vista é melhor: parcelar sai ${formatBRL(Math.abs(finalBalanceCents))} mais caro no fim.`
        : 'Dá no mesmo: as duas opções terminam com o mesmo dinheiro no bolso.';

  return {
    cashTotalCents: cashPriceCents,
    installmentTotalCents,
    differenceCents: installmentTotalCents - cashPriceCents,
    investmentGainCents,
    finalBalanceCents,
    implicitMonthlyRatePercent,
    implicitAnnualRatePercent,
    betterOption,
    verdict,
  };
}
