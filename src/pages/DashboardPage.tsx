import React, { useMemo, useState } from 'react';
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
  Settings2,
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
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui';
import { usePageData } from '../hooks/usePageData';

/* ─── Greeting helper ─── */
function getGreeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
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
  const { isLoading, loadFailed, retry } = usePageData();
  const [now] = useState(() => new Date());
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
    let baseYear = now.getFullYear();
    let baseMonth = now.getMonth() + 1;
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
  }, [transactions, selectedPeriod, netWorth, now]);

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
        iconColor: 'var(--color-warning)',
        title: 'Orçamento próximo do limite',
        desc: `Você já usou ${criticalBudget.percentage.toFixed(0)}% do orçamento de ${criticalBudget.category?.name ?? 'uma categoria'}.`,
        href: '/orcamentos',
      });
    }

    /* Cards invoice due soon */
    const cardsDueSoon = cards.find(c => {
      if (!c.dueDay) return false;
      const diff = c.dueDay - now.getDate();
      return diff >= 0 && diff <= 5;
    });
    if (cardsDueSoon) {
      const diff = (cardsDueSoon.dueDay ?? 0) - now.getDate();
      items.push({
        icon: CreditCard,
        iconColor: 'var(--color-accent)',
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
        iconColor: 'var(--color-negative)',
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
        iconColor: 'var(--color-negative)',
        title: 'Gasto incomum detectado',
        desc: `Seus gastos com ${topCat?.categoryName?.toLowerCase() ?? 'despesas'} aumentaram ${comparison.expenseVariationPercent.toFixed(0)}% este mês.`,
        href: '/gastos',
      });
    }

    return items.slice(0, 3);
  }, [budgetReports, cards, alerts, comparison, categoryBreakdown, now]);

  /* ─── Recent 5 transactions ─── */
  const recent = transactions.slice(0, 5);
  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;

  const insightBorderColor = insight.type === 'positive' ? 'var(--color-positive)' : insight.type === 'negative' ? 'var(--color-negative)' : 'var(--color-accent)';

  /* O IndexedDB não respondeu. Sem esta guarda a página desenhava o estado
     vazio, indistinguível de "você não tem lançamentos". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={5} />;
  }

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <PageHeader
        eyebrow={`${getGreeting(now.getHours())},`}
        title={`${settings.name || 'Você'} 👋`}
        leading={
          /* O atalho para Configurações fica, mas o cachorro sai da
             saudação: a marca já vive no topbar e na sidebar, e
             repeti-la aqui competia com a hierarquia do valor.
             Um ícone neutro de 20px mantém o alvo de toque e o
             aria-label intactos. */
          <button
            type="button"
            onClick={() => navigate('/configuracoes')}
            aria-label="Abrir configurações"
            className="md:hidden shrink-0 -ml-1 w-10 h-10 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          >
            <Settings2 size={20} aria-hidden="true" />
          </button>
        }
        action={
          <button
            type="button"
            onClick={() => navigate('/alertas')}
            aria-label={
              unreadAlertCount > 0
                ? `Notificações (${unreadAlertCount} não lidas)`
                : 'Notificações'
            }
            className="relative btn btn-icon btn-ghost shrink-0"
          >
            <Bell size={17} aria-hidden="true" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-negative" />
            )}
          </button>
        }
      />

      {/* ── PATRIMÔNIO ──
          O objeto principal da tela. O valor é o único elemento em
          escala .num-hero e fica sozinho na primeira faixa; a
          sparkline perdeu altura e-opacity porque é contexto, não
          informação. As três métricas abaixo são filhas do
          patrimônio, então compartilham a mesma divisória. */}
      <div className="card-hero p-5 sm:p-6">
        <p className="label-brand mb-3">Seu patrimônio</p>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-1">
          <div className="num-hero">{formatCurrency(netWorth)}</div>
          <div className={`pill ${comparison.expenseVariationPercent <= 0 ? 'pill-positive' : 'pill-negative'} mb-1.5`}>
            {comparison.expenseVariationPercent <= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {comparison.expenseVariationPercent <= 0
              ? `−${Math.abs(comparison.expenseVariationPercent).toFixed(1)}% gastos`
              : `+${comparison.expenseVariationPercent.toFixed(1)}% gastos`}
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="h-8 w-full mt-3 mb-5 opacity-70" aria-hidden="true">
          <MiniSparkline data={sparklineData} color="var(--color-accent)" />
        </div>

        {/* Sub-row: contas / cartões / investimentos */}
        <div className="grid grid-cols-3 gap-2 pt-5 border-t border-edge">
          <button
            onClick={() => navigate('/contas')}
            className="flex flex-col items-start p-2.5 rounded-2xl hover:bg-surface-raised transition-colors group min-w-0"
          >
            <div className="flex items-center space-x-1.5 mb-1 max-w-full">
              <Wallet size={12} className="text-ink-muted group-hover:text-positive transition-colors shrink-0" />
              <span className="label-xs truncate">Contas</span>
            </div>
            <span className="text-xs font-bold text-ink tracking-tight truncate max-w-full">{formatCurrency(accountsBalance)}</span>
          </button>

          <button
            onClick={() => navigate('/cartoes')}
            className="flex flex-col items-start p-2.5 rounded-2xl hover:bg-surface-raised transition-colors group min-w-0"
          >
            <div className="flex items-center space-x-1.5 mb-1 max-w-full">
              <CreditCard size={12} className="text-ink-muted group-hover:text-negative transition-colors shrink-0" />
              <span className="label-xs truncate">Cartões</span>
            </div>
            <span className="text-xs font-bold text-negative tracking-tight truncate max-w-full">
              {totalCardsDebt > 0 ? `−${formatCurrency(totalCardsDebt)}` : formatCurrency(0)}
            </span>
          </button>

          <button
            onClick={() => navigate('/investimentos')}
            className="flex flex-col items-start p-2.5 rounded-2xl hover:bg-surface-raised transition-colors group min-w-0"
          >
            <div className="flex items-center space-x-1.5 mb-1 max-w-full">
              <TrendingUp size={12} className="text-ink-muted group-hover:text-accent-text transition-colors shrink-0" />
              <span className="label-xs truncate">Investimentos</span>
            </div>
            <span className="text-xs font-bold text-ink tracking-tight truncate max-w-full">{formatCurrency(totalInvested)}</span>
          </button>
        </div>
      </div>

      {/* ── RESUMO DO MÊS ──
          Fica logo abaixo do patrimônio, e não no fim da página.
          Patrimônio responde "quanto eu tenho" e este bloco
          responde "como esse mês está indo" — são perguntas
          diferentes, então têm cards diferentes. Burying it below
          the transaction list made the month invisible on first
          scroll. */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label-section">Resumo do mês</p>
          <button
            type="button"
            onClick={() => navigate('/gastos')}
            className="text-xs font-semibold text-accent-text inline-flex items-center gap-0.5 hover:underline"
          >
            <span>Analisar</span>
            <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="label-xs mb-1">Receitas</p>
            <p className="text-base font-bold text-positive tracking-tight">{formatCurrency(monthIncome)}</p>
          </div>
          <div>
            <p className="label-xs mb-1">Despesas</p>
            <p className="text-base font-bold text-negative tracking-tight">{formatCurrency(monthExpenses)}</p>
          </div>
        </div>
        {monthIncome > 0 && (
          <>
            <div className="progress-track mt-4">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (monthExpenses / monthIncome) * 100)}%`,
                  backgroundColor: monthExpenses > monthIncome ? 'var(--color-negative)' : 'var(--color-positive)',
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

      {/* ── INSIGHT PRINCIPAL ──
          A borda esquerda de 3px era a única coisa separando este
          card do resto, e ela competia com a hierarquia do
          patrimônio. O tint indigo faz o mesmo trabalho com menos
          peso; a cor semântica do insight entra só no ponto do
          título, onde carrega significado em vez de decoração. */}
      <button
        type="button"
        onClick={() => navigate('/gastos')}
        className="w-full text-left rounded-2xl p-4 border border-accent/25 bg-accent-subtle card-hover"
        style={{ borderColor: `color-mix(in srgb, ${insightBorderColor} 28%, transparent)` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <Sparkles size={13} className="shrink-0" style={{ color: insightBorderColor }} aria-hidden="true" />
              <span className="label-section">Insight do mês</span>
            </div>
            <p className="text-sm font-semibold text-ink leading-snug mb-1">
              {insight.emoji} {insight.headline}
            </p>
            <p className="text-sm text-ink-muted leading-relaxed">{insight.sub}</p>
          </div>
          <ChevronRight size={16} className="text-ink-faint shrink-0 mt-0.5" aria-hidden="true" />
        </div>
        <span className="mt-3 inline-block text-xs font-semibold text-accent-text">
          Ver análise →
        </span>
      </button>

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
                    style={{
              backgroundColor: `color-mix(in oklab, ${item.iconColor} 10%, transparent)`,
              color: item.iconColor,
            }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink mb-0.5">{item.title}</p>
                    <p className="text-sm text-ink-muted leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-ink-faint shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AÇÕES RÁPIDAS ──
          Sem o anel colorido de 36px em volta do ícone: quatro
          manchas saturadas lado a lado viravam o bloco mais
          ruidoso da tela. Agora o glyph carrega a cor diretamente
          sobre a superfície neutra, o que mantém a distinção
          Despesa/Receita/Transferir/Gastos com muito menos peso.
          O alvo de toque continua acima de 44px. */}
      <div>
        <p className="label-section mb-3 px-0.5">Ações rápidas</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Despesa',  icon: ArrowDownLeft,  color: 'var(--color-negative)', action: () => openNewTxModal('expense') },
            { label: 'Receita',  icon: ArrowUpRight,   color: 'var(--color-positive)', action: () => openNewTxModal('income') },
            { label: 'Transferir', icon: ArrowLeftRight, color: 'var(--color-accent-text)', action: () => openNewTxModal('transfer') },
            { label: 'Gastos',   icon: Target,         color: 'var(--color-warning)', action: () => navigate('/gastos') },
          ].map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                type="button"
                onClick={qa.action}
                className="flex flex-col items-center gap-2 py-3 px-1 min-w-0 min-h-[56px] rounded-2xl card card-hover"
              >
                <Icon size={18} className="shrink-0" style={{ color: qa.color }} strokeWidth={2} aria-hidden="true" />
                <span className="text-xs font-medium text-ink-muted text-center leading-tight truncate max-w-full px-0.5">{qa.label}</span>
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
            className="text-xs font-semibold text-accent-text flex items-center space-x-0.5 hover:underline"
          >
            <span>Ver tudo</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            compact
            icon={ArrowLeftRight}
            title="Nenhuma movimentação ainda"
            description="Seu histórico financeiro aparecerá aqui."
            action={
              <button
                type="button"
                onClick={() => openNewTxModal('expense')}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} aria-hidden="true" />
                Adicionar primeira transação
              </button>
            }
          />
        ) : (
          <div className="card overflow-hidden stagger">
            {recent.map((tx, idx) => {
              const category = categories.find(c => c.id === tx.categoryId);
              const account  = accounts.find(a => a.id === tx.accountId);
              const card     = cards.find(c => c.id === tx.cardId);
              return (
                <div key={tx.id} className={`animate-fade-in ${idx < recent.length - 1 ? 'border-b border-edge' : ''}`}>
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
    </div>
  );
};
