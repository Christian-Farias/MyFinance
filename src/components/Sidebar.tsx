import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  PieChart,
  Sparkles,
  CreditCard,
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
  Search,
  Clock,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

/**
 * Desktop navigation.
 *
 * The nav item styles were written out three times, the unread badge had no
 * accessible text, and the brand was an <h1> that competed with the page
 * heading on all 17 routes.
 */

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  badge?: string;
  count?: number;
  end?: boolean;
}

export const Sidebar: React.FC = () => {
  const { openNewTxModal, alerts, isOffline, setGlobalSearchOpen } = useFinance();
  const unreadAlerts = alerts.filter((alert) => !alert.isRead).length;

  const primaryNav: NavItem[] = [
    { to: '/', label: 'Início', icon: Home, end: true },
    { to: '/compromissos', label: 'Compromissos', icon: Clock },
    { to: '/calendario', label: 'Calendário', icon: Calendar },
    { to: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: TrendingUp },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
    { to: '/ia', label: 'Neguin', icon: Sparkles, badge: 'IA' },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  ];

  const secondaryNav: NavItem[] = [
    { to: '/fechamento', label: 'Fechamento Mensal', icon: FileSpreadsheet },
    { to: '/contas', label: 'Contas', icon: Wallet },
    { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
    { to: '/orcamentos', label: 'Orçamentos', icon: Sliders },
    { to: '/metas', label: 'Metas', icon: Target },
    { to: '/investimentos', label: 'Investimentos', icon: LineChart },
    { to: '/alertas', label: 'O que mudou', icon: Bell, count: unreadAlerts },
    { to: '/importar', label: 'Importar Extrato', icon: Upload },
  ];

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
      >
        <Icon size={17} aria-hidden={true} />
        <span className="min-w-0 truncate">{item.label}</span>
        {item.badge && <span className="pill pill-accent text-[10px] py-0 px-1.5">{item.badge}</span>}
        {Boolean(item.count && item.count > 0) && (
          <span className="badge-count" aria-label={`${item.count} não lidas`}>
            {item.count}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside aria-label="Navegação principal" className="sidebar">
      {/* Brand — not an <h1>: each route owns the page heading. */}
      <div className="sidebar-brand">
        <img
          src="/logo.png"
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-xl object-contain bg-black border border-active"
        />
        <div className="min-w-0">
          <p className="text-ink font-bold text-base tracking-tight leading-none">
            MyFinance
          </p>
          <span className="text-ink-muted text-[11px] font-medium">
            Assistente Pessoal
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setGlobalSearchOpen(true)}
        className="btn btn-secondary btn-sm w-full justify-start gap-2 mb-2"
      >
        <Search size={15} aria-hidden="true" />
        <span>Buscar</span>
        <kbd className="ml-auto text-[10px] text-ink-faint">⌘K</kbd>
      </button>

      <button
        type="button"
        onClick={() => openNewTxModal('expense')}
        className="btn btn-primary w-full mb-5"
      >
        <Plus size={15} aria-hidden="true" />
        <span>Nova Transação</span>
      </button>

      <nav className="flex-1 overflow-y-auto">
        <p className="label-section">Principal</p>
        <div className="space-y-1">{primaryNav.map(renderItem)}</div>

        <div className="pt-5">
          <p className="label-section">Mais Opções</p>
          <div className="space-y-1">{secondaryNav.map(renderItem)}</div>
        </div>
      </nav>

      <div className="pt-4 border-t border-edge space-y-2">
        {isOffline && (
          <p className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(245_158_11/0.10)] border border-[rgb(245_158_11/0.20)] text-warning text-xs font-medium">
            <WifiOff size={14} aria-hidden="true" />
            <span>Modo Offline</span>
          </p>
        )}

        <NavLink
          to="/configuracoes"
          className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
        >
          <Settings size={17} aria-hidden={true} />
          <span className="min-w-0 truncate">Configurações</span>
          <User size={14} className="ml-auto text-ink-faint" aria-hidden="true" />
        </NavLink>
      </div>
    </aside>
  );
};