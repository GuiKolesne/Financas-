import { lastDayOfMonth, addMonths } from './billing-cycle';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Primeiro e último dia do mês, em ISO. */
export function monthRange(monthISO: string): { start: string; end: string } {
  const [year, month] = monthISO.split('-').map(Number);
  const ultimo = String(lastDayOfMonth(year, month)).padStart(2, '0');
  const mm = String(month).padStart(2, '0');

  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${ultimo}` };
}

/** Normaliza uma data qualquer para o dia 1 do seu mês. */
export function currentMonthISO(
  today: string = new Date().toISOString().slice(0, 10),
): string {
  return `${today.slice(0, 7)}-01`;
}

/** Anda `delta` meses, virando o ano quando precisa. */
export function shiftMonth(monthISO: string, delta: number): string {
  const [year, month] = monthISO.split('-').map(Number);
  const alvo = addMonths(year, month, delta);

  return `${alvo.year}-${String(alvo.month).padStart(2, '0')}-01`;
}

/** "2026-08-01" → "agosto de 2026". */
export function monthLabel(monthISO: string): string {
  const [year, month] = monthISO.split('-').map(Number);
  return `${MESES[month - 1]} de ${year}`;
}
