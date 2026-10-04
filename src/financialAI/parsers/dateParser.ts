import { DateRange } from '../types';

const MONTH_NAMES: Record<string, number> = {
  'janeiro': 0, 'jan': 0,
  'fevereiro': 1, 'fev': 1,
  'março': 2, 'marco': 2, 'mar': 2,
  'abril': 3, 'abr': 3,
  'maio': 4, 'mai': 4,
  'junho': 5, 'jun': 5,
  'julho': 6, 'jul': 6,
  'agosto': 7, 'ago': 7,
  'setembro': 8, 'set': 8,
  'outubro': 9, 'out': 9,
  'novembro': 10, 'nov': 10,
  'dezembro': 11, 'dez': 11,
};

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function parseNaturalLanguageDate(text: string, referenceDate: Date = new Date()): DateRange {
  const lower = text.toLowerCase().trim();
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed
  const day = referenceDate.getDate();

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  const toYM = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;
  const getMonthLastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  const todayStr = toYMD(referenceDate);
  const currentYM = toYM(year, month);

  // 1. Anteontem
  if (lower.includes('anteontem')) {
    const d = new Date(referenceDate);
    d.setDate(day - 2);
    const s = toYMD(d);
    return { startDate: s, endDate: s, monthYear: toYM(d.getFullYear(), d.getMonth()), label: 'Anteontem' };
  }

  // 2. Ontem
  if (lower.includes('ontem')) {
    const d = new Date(referenceDate);
    d.setDate(day - 1);
    const s = toYMD(d);
    return { startDate: s, endDate: s, monthYear: toYM(d.getFullYear(), d.getMonth()), label: 'Ontem' };
  }

  // 3. Amanhã
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    const d = new Date(referenceDate);
    d.setDate(day + 1);
    const s = toYMD(d);
    return { startDate: s, endDate: s, monthYear: toYM(d.getFullYear(), d.getMonth()), label: 'Amanhã' };
  }

  // 4. Hoje (apenas se explícito)
  if (/\bhoje\b/.test(lower)) {
    return { startDate: todayStr, endDate: todayStr, monthYear: currentYM, label: 'Hoje' };
  }

  // 5. "Desde o início do mês" / "começo do mês até agora"
  if (lower.includes('desde o início') || lower.includes('desde o inicio') || lower.includes('começo do mês') || lower.includes('comeco do mes')) {
    return {
      startDate: `${currentYM}-01`,
      endDate: todayStr,
      monthYear: currentYM,
      label: 'Desde o início do mês',
    };
  }

  // 6. Janelas móveis (Rolling Windows)
  // "últimos 7 dias"
  if (lower.includes('7 dias') || lower.includes('últimos 7') || lower.includes('ultimos 7')) {
    const d = new Date(referenceDate);
    d.setDate(day - 7);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 7 dias', isRollingWindow: true };
  }

  // "últimos 15 dias"
  if (lower.includes('15 dias') || lower.includes('últimos 15') || lower.includes('ultimos 15')) {
    const d = new Date(referenceDate);
    d.setDate(day - 15);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 15 dias', isRollingWindow: true };
  }

  // "últimos 30 dias"
  if (lower.includes('30 dias') || lower.includes('últimos 30') || lower.includes('ultimos 30')) {
    const d = new Date(referenceDate);
    d.setDate(day - 30);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 30 dias', isRollingWindow: true };
  }

  // "últimos 60 dias"
  if (lower.includes('60 dias') || lower.includes('últimos 60') || lower.includes('ultimos 60')) {
    const d = new Date(referenceDate);
    d.setDate(day - 60);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 60 dias', isRollingWindow: true };
  }

  // "últimos 90 dias" / "últimos 3 meses"
  if (lower.includes('90 dias') || lower.includes('últimos 3 meses') || lower.includes('ultimos 3 meses') || lower.includes('últimos três meses')) {
    const d = new Date(referenceDate);
    d.setDate(day - 90);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 3 meses', isRollingWindow: true };
  }

  // "últimos 6 meses"
  if (lower.includes('últimos 6 meses') || lower.includes('ultimos 6 meses') || lower.includes('últimos seis meses')) {
    const d = new Date(referenceDate);
    d.setDate(day - 180);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 6 meses', isRollingWindow: true };
  }

  // "últimos 12 meses" / "último ano" (rolling)
  if (lower.includes('últimos 12 meses') || lower.includes('ultimos 12 meses') || lower.includes('últimos doze meses')) {
    const d = new Date(referenceDate);
    d.setDate(day - 365);
    return { startDate: toYMD(d), endDate: todayStr, monthYear: currentYM, label: 'Últimos 12 meses', isRollingWindow: true };
  }

  // 7. Esta semana
  if (lower.includes('esta semana') || lower.includes('essa semana') || lower.includes('nesta semana')) {
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = referenceDate.getDay();
    startOfWeek.setDate(day - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startDate: toYMD(startOfWeek), endDate: toYMD(endOfWeek), monthYear: currentYM, label: 'Esta Semana' };
  }

  // 8. Semana passada
  if (lower.includes('semana passada') || lower.includes('última semana') || lower.includes('ultima semana')) {
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = referenceDate.getDay();
    startOfWeek.setDate(day - dayOfWeek - 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startDate: toYMD(startOfWeek), endDate: toYMD(endOfWeek), monthYear: toYM(startOfWeek.getFullYear(), startOfWeek.getMonth()), label: 'Semana Passada' };
  }

  // 9. Próxima semana
  if (lower.includes('próxima semana') || lower.includes('proxima semana')) {
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = referenceDate.getDay();
    startOfWeek.setDate(day - dayOfWeek + 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startDate: toYMD(startOfWeek), endDate: toYMD(endOfWeek), monthYear: toYM(startOfWeek.getFullYear(), startOfWeek.getMonth()), label: 'Próxima Semana' };
  }

  // 10. Mês passado / Mês anterior
  if (lower.includes('mês passado') || lower.includes('mes passado') || lower.includes('mês anterior') || lower.includes('mes anterior') || lower.includes('no último mês') || lower.includes('no ultimo mes')) {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const prevYM = toYM(prevYear, prevMonth);
    const start = `${prevYM}-01`;
    const lastDay = getMonthLastDay(prevYear, prevMonth);
    const end = `${prevYM}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: start, endDate: end, monthYear: prevYM, label: `Mês Passado (${MONTH_LABELS[prevMonth]})` };
  }

  // 11. Próximo mês / Mês que vem
  if (lower.includes('próximo mês') || lower.includes('proximo mes') || lower.includes('mês que vem') || lower.includes('mes que vem')) {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const nextYM = toYM(nextYear, nextMonth);
    const start = `${nextYM}-01`;
    const lastDay = getMonthLastDay(nextYear, nextMonth);
    const end = `${nextYM}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: start, endDate: end, monthYear: nextYM, label: `Próximo Mês (${MONTH_LABELS[nextMonth]})` };
  }

  // 12. Trimestres (Q1, Q2, Q3, Q4)
  if (lower.includes('primeiro trimestre') || lower.includes('1º trimestre') || lower.includes('1o trimestre') || lower.includes('q1')) {
    return { startDate: `${year}-01-01`, endDate: `${year}-03-31`, label: `1º Trimestre de ${year}` };
  }
  if (lower.includes('segundo trimestre') || lower.includes('2º trimestre') || lower.includes('2o trimestre') || lower.includes('q2')) {
    return { startDate: `${year}-04-01`, endDate: `${year}-06-30`, label: `2º Trimestre de ${year}` };
  }
  if (lower.includes('terceiro trimestre') || lower.includes('3º trimestre') || lower.includes('3o trimestre') || lower.includes('q3')) {
    return { startDate: `${year}-07-01`, endDate: `${year}-09-30`, label: `3º Trimestre de ${year}` };
  }
  if (lower.includes('quarto trimestre') || lower.includes('4º trimestre') || lower.includes('4o trimestre') || lower.includes('q4')) {
    return { startDate: `${year}-10-01`, endDate: `${year}-12-31`, label: `4º Trimestre de ${year}` };
  }

  // 13. "Entre os dias X e Y" / "do dia X ao Y"
  const rangeMatch = lower.match(/(?:entre\s+(?:os\s+)?dias?|do\s+dia)\s+(\d{1,2})\s+(?:e|a|ao)\s+(?:dia\s+)?(\d{1,2})/);
  if (rangeMatch) {
    const startDay = Math.min(parseInt(rangeMatch[1], 10), 31);
    const endDay = Math.min(parseInt(rangeMatch[2], 10), 31);
    const startStr = `${currentYM}-${String(startDay).padStart(2, '0')}`;
    const endStr = `${currentYM}-${String(endDay).padStart(2, '0')}`;
    return {
      startDate: startStr,
      endDate: endStr,
      monthYear: currentYM,
      label: `De ${startDay} a ${endDay} deste mês`,
    };
  }

  // 14. Nomes específicos de meses (ex: "outubro", "em outubro de 2026", "despesas de setembro")
  for (const [mName, mIdx] of Object.entries(MONTH_NAMES)) {
    const regex = new RegExp(`\\b(?:de\\s+|em\\s+)?${mName}(?:\\s+(?:de\\s+)?(\\d{4}))?\\b`, 'i');
    const match = lower.match(regex);
    if (match) {
      const targetYear = match[1] ? parseInt(match[1], 10) : year;
      const targetYM = toYM(targetYear, mIdx);
      const lastDay = getMonthLastDay(targetYear, mIdx);
      return {
        startDate: `${targetYM}-01`,
        endDate: `${targetYM}-${String(lastDay).padStart(2, '0')}`,
        monthYear: targetYM,
        label: `${MONTH_LABELS[mIdx]} de ${targetYear}`,
      };
    }
  }

  // 15. Anos específicos (ex: "em 2025", "ano de 2024")
  const yearMatch = lower.match(/\b(?:ano\s+de\s+|em\s+)(20\d{2})\b/);
  if (yearMatch) {
    const yVal = parseInt(yearMatch[1], 10);
    return { startDate: `${yVal}-01-01`, endDate: `${yVal}-12-31`, label: `Ano de ${yVal}` };
  }

  // 16. Este ano / Ano passado
  if (lower.includes('este ano') || lower.includes('esse ano') || lower.includes('ano atual')) {
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: `Ano de ${year}` };
  }
  if (lower.includes('ano passado') || lower.includes('ano anterior')) {
    const py = year - 1;
    return { startDate: `${py}-01-01`, endDate: `${py}-12-31`, label: `Ano de ${py}` };
  }

  // 17. "dia 10", "dia 15", etc.
  const dayMatch = lower.match(/\bdia\s+(\d{1,2})\b/);
  if (dayMatch) {
    const targetDay = Math.min(parseInt(dayMatch[1], 10), 31);
    const dStr = `${currentYM}-${String(targetDay).padStart(2, '0')}`;
    return { startDate: dStr, endDate: dStr, monthYear: currentYM, label: `Dia ${targetDay}` };
  }

  // 18. Default: "este mês" / "mês atual"
  const start = `${currentYM}-01`;
  const lastDay = getMonthLastDay(year, month);
  const end = `${currentYM}-${String(lastDay).padStart(2, '0')}`;
  return { startDate: start, endDate: end, monthYear: currentYM, label: 'Este Mês' };
}

