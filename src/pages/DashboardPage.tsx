import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Sparkles,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Bell,
  Plus,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  calculateNetWorth,
  calculateTotalBalance,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateCategoryBreakdown,
  calculateMonthlyComparison,
  calculateBudgetUsage,
} from '../calculations/financialCalculations';
import { TransactionItem } from '../components/TransactionItem';

/* ─── Greeting helper ─── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/* ─── Sparkline mini chart ─── */
const MiniSparkline: React.FC<{ data: { v: number }[]; color: string }> = ({ data, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#sparkGrad)" dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    accounts,
    transactions,
    categories,
    cards,
    investments,
    budgets,
    alerts,
    settings,
    selectedPeriod,
    openNewTxModal,
    openTxDetail,
  } = useFinance();

  /* ─── Core calculations ─── */
  const netWorth        = calculateNetWorth(accounts, investments, cards);
  const accountsBalance = calculateTotalBalance(accounts);
  const totalInvested   = investments.reduce((s, i) => s + (i.currentValue ?? i.totalInvested), 0);
  const totalCardsDebt  = cards.reduce((s, c) => s + Math.max(0, c.limit - c.availableLimit), 0);
  const monthIncome     = calculateTotalIncome(transactions, selectedPeriod);
  const monthExpenses   = calculateTotalExpenses(transactions, selectedPeriod);

  const comparison = useMemo(
    () => calculateMonthlyComparison(transactions, categories, selectedPeriod),
    [transactions, categories, selectedPeriod],
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, selectedPeriod),
    [transactions, categories, selectedPeriod],
  );

  const budgetReports = useMemo(
    () => calculateBudgetUsage(budgets, transactions, categories, selectedPeriod),
    [budgets, transactions, categories, selectedPeriod],
  );

  /* ─── Sparkline data (6 months) ─── */
  const sparklineData = useMemo(() => {
    let baseYear = new Date().getFullYear();
    let baseMonth = new Date().getMonth() + 1;
    if (selectedPeriod?.includes('-')) {
      const [y, m] = selectedPeriod.split('-');
      baseYear  = parseInt(y, 10);
      baseMonth = parseInt(m, 10);
    }
    return Array.from({ length: 6 }, (_, i) => {
      const d  = new Date(baseYear, baseMonth - 1 - (5 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const inc = calculateTotalIncome(transactions, ym);
      const exp = calculateTotalExpenses(transactions, ym);
      return { v: Math.max(0, inc - exp + netWorth / 6) };
    });
  }, [transactions, selectedPeriod, netWorth]);

  /* ─── Dynamic insight ─── */
  const insight = useMemo(() => {
    const pct = comparison.expenseVariationPercent;
    if (categoryBreakdown.length === 0) {
      return {
        emoji: '👋',
        headline: 'Bem-vindo ao seu assistente financeiro.',
        sub: 'Adicione suas primeiras transações para começar a receber insights.',
        type: 'neutral' as const,
      };
    }
    if (pct < -5) {
      return {
        emoji: '🎉',
        headline: `Você gastou ${Math.abs(pct).toFixed(0)}% menos este mês.`,
        sub: `Seus gastos caíram principalmente em ${categoryBreakdown[0]?.categoryName?.toLowerCase() ?? 'despesas'}.`,
        type: 'positive' as const,
      };
    }
    if (pct > 10) {
      return {
        emoji: '⚠️',
        headline: `Seus gastos aumentaram ${pct.toFixed(0)}% este mês.`,
        sub: `O principal aumento foi em ${categoryBreakdown[0]?.categoryName?.toLowerCase() ?? 'despesas'}.`,
        type: 'negative' as const,
      };
    }
    const top = categoryBreakdown[0];
    return {
      emoji: '📊',
      headline: `${top?.categoryName ?? 'Outros'} é sua maior despesa este mês.`,
      sub: `Representa ${top?.percentage?.toFixed(0) ?? 0}% do total gasto — ${formatCurrency(top?.total ?? 0)}.`,
      type: 'neutral' as const,
    };
  }, [comparison, categoryBreakdown]);

  /* ─── Attention items (max 3) ─── */
  const attentionItems = useMemo(() => {
    const items: { icon: React.ElementType; iconColor: string; title: string; desc: string; href: string }[] = [];

    /* Budget near limit */
    const criticalBudget = budgetReports.find(r => r.percentage >= 85);
    if (criticalBudget) {
      items.push({
        icon: AlertTriangle,
        iconColor: '#F59E0B',
        title: 'Orçamento próximo do limite',
        desc: `Você já usou ${criticalBudget.percentage.toFixed(0)}% do orçamento de ${criticalBudget.category?.name ?? 'uma categoria'}.`,
        href: '/orcamentos',
      });
    }

    /* Cards invoice due soon */
    const cardsDueSoon = cards.find(c => {
      if (!c.dueDay) return false;
      const today = new Date().getDate();
      const diff  = c.dueDay - today;
      return diff >= 0 && diff <= 5;
    });
    if (cardsDueSoon) {
      const diff = (cardsDueSoon.dueDay ?? 0) - new Date().getDate();
      items.push({
        icon: CreditCard,
        iconColor: '#8B7CFF',
        title: 'Fatura próxima do vencimento',
        desc: `Sua fatura do ${cardsDueSoon.name} vence em ${diff === 0 ? 'hoje' : `${diff} dia${diff > 1 ? 's' : ''}`}.`,
        href: '/cartoes',
      });
    }

    /* Unread alerts */
    const unread = alerts.filter(a => !a.isRead);
    if (unread.length > 0 && items.length < 3) {
      items.push({
        icon: Bell,
        iconColor: '#FF5C5C',
        title: unread[0].title,
        desc: unread[0].message,
        href: '/alertas',
      });
    }

    /* Spending spike */
    if (items.length < 3 && comparison.expenseVariationPercent > 15) {
      const topCat = categoryBreakdown[0];
      items.push({
        icon: TrendingUp,
        iconColor: '#FF5C5C',
        title: 'Gasto incomum detectado',
        desc: `Seus gastos com ${topCat?.categoryName?.toLowerCase() ?? 'despesas'} aumentaram ${comparison.expenseVariationPercent.toFixed(0)}% este mês.`,
        href: '/gastos',
      });
    }

    return items.slice(0, 3);
  }, [budgetReports, cards, alerts, comparison, categoryBreakdown]);

  /* ─── Recent 5 transactions ─── */
  const recent = transactions.slice(0, 5);

  const insightBorderColor = insight.type === 'positive' ? '#39D98A' : insight.type === 'negative' ? '#FF5C5C' : '#8B7CFF';

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="MyFinance" 
            className="w-10 h-10 rounded-2xl object-contain bg-black border border-[#222733] shadow-sm cursor-pointer md:hidden"
            onClick={() => navigate('/configuracoes')}
          />
          <div>
            <p className="label-xs mb-0.5">{getGreeting()},</p>
            <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
              {settings.name || 'Você'} 👋
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/alertas')}
          className="relative w-10 h-10 rounded-full flex items-center justify-center bg-[#0D0F12] border border-[#1D2026] hover:border-[#272B34] transition-colors"
        >
          <Bell size={17} className="text-[#8B919B]" />
          {alerts.filter(a => !a.isRead).length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5C5C]" />
          )}
        </button>
      </div>

      {/* ── PATRIMÔNIO ── */}
      <div className="card p-5">
        <p className="label-xs mb-3">Seu patrimônio</p>

        <div className="flex items-end justify-between mb-2">
          <div className="num-xl">{formatCurrency(netWorth)}</div>
          <div className={`pill ${comparison.expenseVariationPercent <= 0 ? 'pill-positive' : 'pill-negative'} mb-1`}>
            {comparison.expenseVariationPercent <= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {comparison.expenseVariationPercent <= 0
              ? `−${Math.abs(comparison.expenseVariationPercent).toFixed(1)}% gastos`
              : `+${comparison.expenseVariationPercent.toFixed(1)}% gastos`}
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="h-10 w-full mb-4">
          <MiniSparkline data={sparklineData} color="#39D98A" />
        </div>

        {/* Sub-row: contas / cartões / investimentos */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#1D2026]">
          <button
            onClick={() => navigate('/contas')}
            className="flex flex-col items-start p-2.5 rounded-2xl hover:bg-[#121419] transition-colors group min-w-0"
          >
            <div className="flex items-center space-x-1.5 mb-1 max-w-full">
              <Wallet size={12} className="text-[#8B919B] group-hover:text-[#39D98A] transition-colors shrink-0" />
              <span className="label-xs truncate">Contas</span>
            </div>
            <span className="text-xs font-bold text-[#F5F5F5] tracking-tight truncate max-w-full">{formatCurrency(accountsBalance)}</span>
          </button>

          <button
            onClick={() => navigate('/cartoes')}
            className="flex flex-col items-start p-2.5 rounded-2xl hover:bg-[#121419] transition-colors group min-w-0"
          >
            <div className="flex items-center space-x-1.5 mb-1 max-w-full">
              <CreditCard size={12} className="text-[#8B919B] group-hover:text-[#FF5C5C] transition-colors shrink-0" />
              <span className="label-xs truncate">Cartões</span>
            </div>
            <span className="text-xs font-bold text-[#FF5C5C] tracking-tight truncate max-w-full">
              {totalCardsDebt > 0 ? `−${formatCurrency(totalCardsDebt)}` : formatCurrency(0)}
            </span>
          </button>

          <button
            onClick={() => navigate('/investimentos')}
            className="flex flex-col items-start p-2.5 rounded-2xl hover:bg-[#121419] transition-colors group min-w-0"
          >
            <div className="flex items-center space-x-1.5 mb-1 max-w-full">
              <TrendingUp size={12} className="text-[#8B919B] group-hover:text-[#8B7CFF] transition-colors shrink-0" />
              <span className="label-xs truncate">Investimentos</span>
            </div>
            <span className="text-xs font-bold text-[#8B7CFF] tracking-tight truncate max-w-full">{formatCurrency(totalInvested)}</span>
          </button>
        </div>
      </div>

      {/* ── INSIGHT PRINCIPAL ── */}
      <div
        className="card p-4 cursor-pointer card-hover"
        style={{ borderLeft: `3px solid ${insightBorderColor}` }}
        onClick={() => navigate('/gastos')}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <Sparkles size={13} className="text-[#8B7CFF]" />
              <span className="label-section">Insight do mês</span>
            </div>
            <p className="text-sm font-semibold text-[#F5F5F5] leading-snug mb-1">
              {insight.emoji} {insight.headline}
            </p>
            <p className="text-xs text-[#8B919B] leading-relaxed">{insight.sub}</p>
          </div>
          <ChevronRight size={16} className="text-[#5F6570] shrink-0 mt-0.5" />
        </div>
        <button className="mt-3 text-xs font-semibold text-[#8B7CFF] hover:underline">
          Ver análise →
        </button>
      </div>

      {/* ── O QUE MERECE SUA ATENÇÃO ── */}
      {attentionItems.length > 0 && (
        <div>
          <p className="label-section mb-3 px-0.5">O que merece sua atenção</p>
          <div className="space-y-2 stagger">
            {attentionItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(item.href)}
                  className="animate-fade-in w-full card p-4 card-hover flex items-start space-x-3.5 text-left"
                >
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${item.iconColor}15`, color: item.iconColor }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#F5F5F5] mb-0.5">{item.title}</p>
                    <p className="text-xs text-[#8B919B] leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-[#5F6570] shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AÇÕES RÁPIDAS ── */}
      <div>
        <p className="label-section mb-3 px-0.5">Ações rápidas</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Despesa',  icon: ArrowDownLeft,  color: '#FF5C5C', action: () => openNewTxModal('expense') },
            { label: 'Receita',  icon: ArrowUpRight,   color: '#39D98A', action: () => openNewTxModal('income') },
            { label: 'Transferir', icon: ArrowLeftRight, color: '#8B7CFF', action: () => openNewTxModal('transfer') },
            { label: 'Gastos',   icon: Target,         color: '#F59E0B', action: () => navigate('/gastos') },
          ].map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                onClick={qa.action}
                className="flex flex-col items-center py-3 px-1 rounded-2xl card card-hover gap-2 min-w-0"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${qa.color}15` }}
                >
                  <Icon size={16} style={{ color: qa.color }} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-medium text-[#8B919B] text-center leading-tight truncate max-w-full px-0.5">{qa.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MOVIMENTAÇÕES RECENTES ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="label-section">Movimentações recentes</p>
          <button
            onClick={() => navigate('/transacoes')}
            className="text-xs font-semibold text-[#8B7CFF] flex items-center space-x-0.5 hover:underline"
          >
            <span>Ver tudo</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#5F6570] mb-3">Seu histórico financeiro aparecerá aqui.</p>
            <button
              onClick={() => openNewTxModal('expense')}
              className="text-xs font-semibold text-[#8B7CFF] hover:underline"
            >
              + Adicionar primeira transação
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden stagger">
            {recent.map((tx, idx) => {
              const category = categories.find(c => c.id === tx.categoryId);
              const account  = accounts.find(a => a.id === tx.accountId);
              const card     = cards.find(c => c.id === tx.cardId);
              return (
                <div key={tx.id} className={`animate-fade-in ${idx < recent.length - 1 ? 'border-b border-[#1D2026]' : ''}`}>
                  <TransactionItem
                    transaction={tx}
                    category={category}
                    account={account}
                    card={card}
                    showDate
                    onClick={() => openTxDetail(tx)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RESUMO DO MÊS ── */}
      <div className="card p-5">
        <p className="label-section mb-4">Resumo do mês</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="label-xs mb-1">Receitas</p>
            <p className="text-base font-bold text-[#39D98A] tracking-tight">{formatCurrency(monthIncome)}</p>
          </div>
          <div>
            <p className="label-xs mb-1">Despesas</p>
            <p className="text-base font-bold text-[#FF5C5C] tracking-tight">{formatCurrency(monthExpenses)}</p>
          </div>
        </div>
        {monthIncome > 0 && (
          <>
            <div className="progress-track mt-4">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (monthExpenses / monthIncome) * 100)}%`,
                  backgroundColor: monthExpenses > monthIncome ? '#FF5C5C' : '#39D98A',
                }}
              />
            </div>
            <p className="label-xs mt-2">
              {monthExpenses <= monthIncome
                ? `Você usou ${((monthExpenses / monthIncome) * 100).toFixed(0)}% da sua renda`
                : 'Despesas excedem receitas este mês'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
