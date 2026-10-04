import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  PieChart, 
  Sparkles, 
  CreditCard, 
  Menu, 
  Settings, 
  User, 
  Plus, 
  WifiOff,
  Wallet,
  ArrowLeftRight,
  Sliders,
  Target,
  LineChart,
  Bell,
  Upload,
  ChevronDown,
  Clock,
  Calendar,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const Sidebar: React.FC = () => {
  const { openNewTxModal, alerts, settings, isOffline } = useFinance();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryNav = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/compromissos', label: 'Compromissos', icon: Clock },
    { to: '/calendario', label: 'Calendário', icon: Calendar },
    { to: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: TrendingUp },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
    { to: '/ia', label: 'Assistente', icon: Sparkles, badge: 'IA' },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  ];

  const secondaryNav = [
    { to: '/fechamento', label: 'Fechamento Mensal', icon: FileSpreadsheet },
    { to: '/contas', label: 'Contas', icon: Wallet },
    { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
    { to: '/orcamentos', label: 'Orçamentos', icon: Sliders },
    { to: '/metas', label: 'Metas', icon: Target },
    { to: '/investimentos', label: 'Investimentos', icon: LineChart },
    { to: '/alertas', label: 'O que mudou', icon: Bell, count: unreadAlerts },
    { to: '/importar', label: 'Importar Extrato', icon: Upload },
  ];

  return (
    <aside 
      aria-label="Navegação desktop"
      className="hidden md:flex flex-col w-64 sticky top-0 bg-[#08090B] border-r border-[#1D2026] p-5 shrink-0 z-10 select-none overflow-y-auto"
      style={{ height: '100dvh' }}
    >
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-7 px-2">
        <img 
          src="/logo.png" 
          alt="MyFinance Logo" 
          className="w-10 h-10 rounded-xl object-contain bg-black border border-[#222733] shadow-md shadow-[#8B7CFF]/15" 
        />
        <div>
          <h1 className="text-white font-bold text-base tracking-tight leading-none">MyFinance</h1>
          <span className="text-[#8B919B] text-[11px] font-medium">Assistente Pessoal</span>
        </div>
      </div>

      {/* Quick Action Button */}
      <button
        onClick={() => openNewTxModal('expense')}
        className="w-full mb-6 py-2.5 px-4 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aee] text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-md shadow-[#8B7CFF]/15 transition-all active:scale-[0.98]"
      >
        <Plus size={15} />
        <span>Nova Transação</span>
      </button>

      {/* Primary Navigation */}
      <nav className="space-y-1 flex-1">
        <p className="label-xs px-3 mb-2 text-[#5F6570]">Principal</p>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#14171D] text-white border border-[#222733] shadow-sm'
                    : 'text-[#8B919B] hover:text-[#F5F5F5] hover:bg-[#0D0F12]'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon size={17} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="pill pill-purple text-[10px] py-0 px-1.5">{item.badge}</span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4">
          <p className="label-xs px-3 mb-2 text-[#5F6570]">Mais Opções</p>
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#14171D] text-white border border-[#222733] shadow-sm'
                        : 'text-[#8B919B] hover:text-[#F5F5F5] hover:bg-[#0D0F12]'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.count && item.count > 0) && (
                    <span className="w-5 h-5 rounded-full bg-[#FF5555] text-white text-[10px] font-bold flex items-center justify-center">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer / Offline / Settings */}
      <div className="pt-4 border-t border-[#1D2026] space-y-2">
        {isOffline && (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-xs font-medium">
            <WifiOff size={14} />
            <span>Modo Offline</span>
          </div>
        )}

        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-[#14171D] text-white border border-[#222733]'
                : 'text-[#8B919B] hover:text-[#F5F5F5] hover:bg-[#0D0F12]'
            }`
          }
        >
          <div className="flex items-center space-x-3">
            <Settings size={17} />
            <span>Configurações</span>
          </div>
          <User size={14} className="text-[#5F6570]" />
        </NavLink>
      </div>
    </aside>
  );
};
