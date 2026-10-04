import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, WifiOff, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  showPeriodSelector?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  subtitle,
  showPeriodSelector = true
}) => {
  const navigate = useNavigate();
  const { 
    settings, 
    transactions,
    selectedPeriod, 
    setSelectedPeriod, 
    alerts, 
    isOffline,
    setGlobalSearchOpen 
  } = useFinance();

  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Dynamically generate periods
  const periods = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    const addPeriod = (ym: string) => {
      if (seen.has(ym) || !ym.includes('-')) return;
      seen.add(ym);
      const [y, m] = ym.split('-');
      const mIdx = parseInt(m, 10) - 1;
      list.push({
        value: ym,
        label: `${monthNames[mIdx] || m} ${y}`
      });
    };

    // Add current month and past 6 months
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      addPeriod(ym);
    }

    // Add any months that exist in transactions
    for (const t of transactions) {
      if (t.date && t.date.length >= 7) {
        addPeriod(t.date.substring(0, 7));
      }
    }

    // Sort descending
    list.sort((a, b) => b.value.localeCompare(a.value));

    // Add 'all' option
    return [
      ...list,
      { value: 'all', label: 'Todos os meses' }
    ];
  }, [transactions]);

  return (
    <header className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6 pt-1 sm:pt-2">
      {/* Offline Alert Banner if disconnected */}
      {isOffline && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-2xl bg-[#2A1810] border border-[#F59E0B]/30 text-[#F59E0B] text-xs">
          <div className="flex items-center space-x-2">
            <WifiOff size={15} className="shrink-0" />
            <span className="font-medium">Modo offline ativo. Todos os dados permanecem salvos no dispositivo.</span>
          </div>
          <span className="text-[10px] bg-[#F59E0B]/20 px-2 py-0.5 rounded-full font-semibold shrink-0">Local</span>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
            {title || `Olá, ${settings.name || 'Lucas'}`}
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8F98] truncate">
            {subtitle || 'Que bom te ver por aqui!'}
          </p>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Global Search Button */}
          <button
            onClick={() => setGlobalSearchOpen(true)}
            aria-label="Buscar"
            className="w-10 h-10 rounded-full bg-[#111216] border border-[#22242A] hover:border-[#333742] flex items-center justify-center text-[#8A8F98] hover:text-white transition-all active:scale-95"
          >
            <Search size={18} />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => navigate('/alertas')}
            aria-label="Alertas e Notificações"
            className="relative w-10 h-10 rounded-full bg-[#111216] border border-[#22242A] hover:border-[#333742] flex items-center justify-center text-[#8A8F98] hover:text-white transition-all active:scale-95"
          >
            <Bell size={18} />
            {unreadAlerts > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5C5C] ring-2 ring-[#111216]" />
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Period Selector Dropdown */}
      {showPeriodSelector && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#111216] border border-[#22242A] text-xs text-[#8A8F98]">
            <Calendar size={13} className="text-[#8B5CF6]" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-1"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value} className="bg-[#111216] text-white">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
