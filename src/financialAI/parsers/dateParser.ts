import { DateRange } from '../types';

export function parseNaturalLanguageDate(text: string, referenceDate: Date = new Date()): DateRange {
  const lower = text.toLowerCase().trim();
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed
  const day = referenceDate.getDate();

  const toYMD = (d: Date) => d.toISOString().split('T')[0];
  const toYM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const todayStr = toYMD(referenceDate);
  const currentYM = toYM(referenceDate);

  // 1. Ontem
  if (lower.includes('ontem')) {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(day - 1);
    const yStr = toYMD(yesterday);
    return { startDate: yStr, endDate: yStr, monthYear: toYM(yesterday), label: 'Ontem' };
  }

  // 2. Amanhã
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(day + 1);
    const tStr = toYMD(tomorrow);
    return { startDate: tStr, endDate: tStr, monthYear: toYM(tomorrow), label: 'Amanhã' };
  }

  // 3. Mês passado
  if (lower.includes('mês passado') || lower.includes('mes passado') || lower.includes('no último mês') || lower.includes('no ultimo mes')) {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const prevYM = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    const start = `${prevYM}-01`;
    const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    const end = `${prevYM}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: start, endDate: end, monthYear: prevYM, label: 'Mês Passado' };
  }

  // 4. Próximo mês
  if (lower.includes('próximo mês') || lower.includes('proximo mes') || lower.includes('mês que vem') || lower.includes('mes que vem')) {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const nextYM = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;
    const start = `${nextYM}-01`;
    const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    const end = `${nextYM}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: start, endDate: end, monthYear: nextYM, label: 'Próximo Mês' };
  }

  // 5. Esta semana
  if (lower.includes('esta semana') || lower.includes('essa semana')) {
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = referenceDate.getDay();
    startOfWeek.setDate(day - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startDate: toYMD(startOfWeek), endDate: toYMD(endOfWeek), monthYear: currentYM, label: 'Esta Semana' };
  }

  // 6. Semana passada
  if (lower.includes('semana passada')) {
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = referenceDate.getDay();
    startOfWeek.setDate(day - dayOfWeek - 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startDate: toYMD(startOfWeek), endDate: toYMD(endOfWeek), monthYear: currentYM, label: 'Semana Passada' };
  }

  // 7. Últimos 7 dias
  if (lower.includes('7 dias') || lower.includes('últimos 7') || lower.includes('ultimos 7')) {
    const d7 = new Date(referenceDate);
    d7.setDate(day - 7);
    return { startDate: toYMD(d7), endDate: todayStr, monthYear: currentYM, label: 'Últimos 7 dias' };
  }

  // 8. Últimos 30 dias
  if (lower.includes('30 dias') || lower.includes('últimos 30') || lower.includes('ultimos 30')) {
    const d30 = new Date(referenceDate);
    d30.setDate(day - 30);
    return { startDate: toYMD(d30), endDate: todayStr, monthYear: currentYM, label: 'Últimos 30 dias' };
  }

  // 9. Este ano
  if (lower.includes('este ano') || lower.includes('esse ano')) {
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: `Ano de ${year}` };
  }

  // 10. Ano passado
  if (lower.includes('ano passado')) {
    const py = year - 1;
    return { startDate: `${py}-01-01`, endDate: `${py}-12-31`, label: `Ano de ${py}` };
  }

  // 11. "dia 10", "dia 15", etc.
  const dayMatch = lower.match(/dia\s+(\d{1,2})/);
  if (dayMatch) {
    const targetDay = parseInt(dayMatch[1], 10);
    let targetMonth = month;
    let targetYear = year;
    // If target day already passed this month, project to current or next month depending on context
    const dStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    return { startDate: dStr, endDate: dStr, monthYear: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`, label: `Dia ${targetDay}` };
  }

  // Default: Este mês
  const start = `${currentYM}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${currentYM}-${String(lastDay).padStart(2, '0')}`;
  return { startDate: start, endDate: end, monthYear: currentYM, label: 'Este Mês' };
}
