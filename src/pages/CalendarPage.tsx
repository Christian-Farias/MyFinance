import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  Check, 
  Clock, 
  Tv, 
  Layers 
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR, getPreviousMonthYear, getNextMonthYear } from '../calculations/financialCalculations';

interface CalendarEventItem {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'bill' | 'receivable' | 'transaction_expense' | 'transaction_income' | 'subscription' | 'card_invoice';
  isPaid?: boolean;
}

export const CalendarPage: React.FC = () => {
  const { 
    bills, 
    receivables, 
    transactions, 
    subscriptions, 
    cards, 
    selectedPeriod, 
    setSelectedPeriod 
  } = useFinance();

  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [viewMode, setViewMode] = useState<'timeline' | 'month'>('timeline');

  // Parse current year/month
  const [yearStr, monthStr] = selectedPeriod.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Month navigation
  const handlePrevMonth = () => setSelectedPeriod(getPreviousMonthYear(selectedPeriod));
  const handleNextMonth = () => setSelectedPeriod(getNextMonthYear(selectedPeriod));

  // Build all events mapped by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();

    const addEvent = (item: CalendarEventItem) => {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    };

    // 1. Bills
    for (const b of bills) {
      if (b.dueDate.startsWith(selectedPeriod)) {
        addEvent({
          id: b.id,
          description: b.description,
          amount: b.amount,
          date: b.dueDate,
          type: 'bill',
          isPaid: b.status === 'paid',
        });
      }
    }

    // 2. Receivables
    for (const r of receivables) {
      if (r.expectedDate.startsWith(selectedPeriod)) {
        addEvent({
          id: r.id,
          description: r.description,
          amount: r.amount,
          date: r.expectedDate,
          type: 'receivable',
          isPaid: r.status === 'received',
        });
      }
    }

    // 3. Transactions of the month
    for (const t of transactions) {
      if (t.date.startsWith(selectedPeriod)) {
        // avoid duplicating if already in bill
        const isFromBill = t.billId || t.receivableId;
        if (!isFromBill) {
          addEvent({
            id: t.id,
            description: t.description,
            amount: t.amount,
            date: t.date,
            type: t.type === 'income' ? 'transaction_income' : 'transaction_expense',
            isPaid: true,
          });
        }
      }
    }

    return map;
  }, [bills, receivables, transactions, selectedPeriod]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month, 0).getDate();

    const days: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNum: 0, dateStr: '', isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    return days;
  }, [year, month]);

  // Selected date events
  const selectedDateEvents = eventsByDate.get(selectedDayStr) || [];
  const selectedTotalOutflow = selectedDateEvents.filter(e => e.type === 'bill' || e.type === 'transaction_expense').reduce((s, e) => s + e.amount, 0);
  const selectedTotalInflow = selectedDateEvents.filter(e => e.type === 'receivable' || e.type === 'transaction_income').reduce((s, e) => s + e.amount, 0);

  // Month total summary
  const monthEventsList = Array.from(eventsByDate.values()).flat();
  const monthTotalOutflows = monthEventsList.filter(e => e.type === 'bill' || e.type === 'transaction_expense').reduce((s, e) => s + e.amount, 0);
  const monthTotalInflows = monthEventsList.filter(e => e.type === 'receivable' || e.type === 'transaction_income').reduce((s, e) => s + e.amount, 0);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">
      {/* ── HEADER & MONTH PICKER ── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Calendário Financeiro</h1>
          <p className="label-xs text-[#8E95A3] mt-0.5">Visão cronológica de vencimentos e receitas</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#14171D] border border-[#222733] rounded-2xl">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-[#1A1F29] text-[#8E95A3] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-white px-2">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-[#1A1F29] text-[#8E95A3] hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <span className="label-xs text-[#39D98A]">Entradas no Mês</span>
            <div className="text-base font-bold text-white mt-0.5">+{formatCurrency(monthTotalInflows)}</div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-[#39D98A]/15 text-[#39D98A] flex items-center justify-center">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <span className="label-xs text-[#FF5555]">Saídas / Contas</span>
            <div className="text-base font-bold text-white mt-0.5">-{formatCurrency(monthTotalOutflows)}</div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-[#FF5555]/15 text-[#FF5555] flex items-center justify-center">
            <ArrowDownLeft size={18} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP & TABLET MONTHLY GRID / MOBILE DATE SELECTOR ── */}
      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-semibold text-[#8E95A3]">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((cd, index) => {
            if (!cd.isCurrentMonth) {
              return <div key={index} className="h-10 sm:h-16 rounded-xl bg-transparent opacity-0" />;
            }

            const dayEvents = eventsByDate.get(cd.dateStr) || [];
            const hasOutflow = dayEvents.some(e => e.type === 'bill' || e.type === 'transaction_expense');
            const hasInflow = dayEvents.some(e => e.type === 'receivable' || e.type === 'transaction_income');
            const isSelected = cd.dateStr === selectedDayStr;
            const isToday = cd.dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={index}
                onClick={() => setSelectedDayStr(cd.dateStr)}
                className={`h-12 sm:h-16 rounded-xl p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all border ${
                  isSelected
                    ? 'border-[#8B7CFF] bg-[#8B7CFF]/15 text-white shadow-md'
                    : isToday
                    ? 'border-[#39D98A]/40 bg-[#1A1F29] text-white'
                    : 'border-[#222733]/60 bg-[#0D0F12]/60 hover:bg-[#1A1F29] text-[#8E95A3]'
                }`}
              >
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : isToday ? 'text-[#39D98A]' : ''}`}>
                  {cd.dayNum}
                </span>

                {/* Event indicators */}
                <div className="flex items-center space-x-1">
                  {hasInflow && <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A]" />}
                  {hasOutflow && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5555]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EVENTS OF SELECTED DAY (LIST VIEW) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white">
            Compromissos de {formatDateBR(selectedDayStr)}
          </h3>
          <span className="label-xs text-[#8E95A3]">
            {selectedDateEvents.length} registro(s)
          </span>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="card p-6 text-center text-[#8E95A3]">
            <CalendarIcon size={32} className="mx-auto mb-2 opacity-30 text-[#8B7CFF]" />
            <p className="text-xs">Nenhum vencimento ou pagamento registrado para este dia.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateEvents.map(event => {
              const isIncome = event.type === 'receivable' || event.type === 'transaction_income';

              return (
                <div key={event.id} className="card p-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-[#39D98A]/15 text-[#39D98A]' : 'bg-[#FF5555]/15 text-[#FF5555]'
                    }`}>
                      {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{event.description}</h4>
                      <span className="text-[11px] text-[#8E95A3] capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${isIncome ? 'text-[#39D98A]' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(event.amount)}
                    </span>
                    {event.isPaid && (
                      <span className="pill pill-positive text-[9px] py-0 px-1.5">Concluído</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
