import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, TrendingUp, Sliders, CreditCard, Layers, CheckCircle2, Clock, CheckCheck, AlertTriangle, ArrowRight, Info, EyeOff,  Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { agentService } from '../financialAgents/agentService';
import type { FinancialInsight, InsightPriority } from '../financialAgents/agentTypes';
import type {  AlertType } from '../types';
import { ErrorState, LoadingState } from '../components/ui';

function formatAlertDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const ALERT_TONE: Record<string, string> = {
  negative: 'bg-negative/12 text-negative',
  warning: 'bg-warning/12 text-warning',
  accent: 'bg-accent/12 text-accent-text',
  positive: 'bg-positive/12 text-positive',
  pink: 'bg-negative-strong/12 text-negative-strong',
};

const ALERT_VISUALS: Record<AlertType, { icon: React.ElementType; tone: string; why: string; action: string; href: string }> = {
  expense_spike: { icon: TrendingUp, tone: 'negative', why: 'Seus gastos estão acima do padrão.', action: 'Ver gastos', href: '/gastos' },
  budget: { icon: Sliders, tone: 'warning', why: 'Você está próximo do seu limite mensal.', action: 'Ver orçamentos', href: '/orcamentos' },
  invoice: { icon: CreditCard, tone: 'accent', why: 'Fatura com vencimento se aproximando.', action: 'Ver cartões', href: '/cartoes' },
  installment: { icon: Layers, tone: 'pink', why: 'Parcela próxima do vencimento.', action: 'Ver cartões', href: '/cartoes' },
  saving: { icon: CheckCircle2, tone: 'positive', why: 'Você está progredindo bem nas economias.', action: 'Ver metas', href: '/metas' },
  goal: { icon: CheckCircle2, tone: 'positive', why: 'Meta com atualização disponível.', action: 'Ver metas', href: '/metas' },
  duplicate: { icon: AlertTriangle, tone: 'warning', why: 'Possível lançamento duplicado detectado.', action: 'Ver transações', href: '/transacoes' },
  bill_due: { icon: Clock, tone: 'negative', why: 'Conta com vencimento próximo.', action: 'Ver compromissos', href: '/compromissos' },
  receivable_due: { icon: CheckCircle2, tone: 'positive', why: 'Recebimento previsto para breve.', action: 'Ver compromissos', href: '/compromissos' },
  projected_balance_low: { icon: AlertTriangle, tone: 'warning', why: 'Risco de saldo baixo nos próximos dias.', action: 'Ver fluxo de caixa', href: '/fluxo-caixa' },
  system: { icon: Bell, tone: 'accent', why: 'Notificação do sistema.', action: 'Saiba mais', href: '' },
};

export const AlertsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const navigate = useNavigate();
  const { 
    alerts, 
    markAlertAsRead, 
    markAllAlertsAsRead,
    accounts,
    transactions,
    categories,
    cards,
    goals,
    budgets,
    bills,
    receivables,
    recurringTransactions,
    subscriptions,
    investments
  } = useFinance();

  const [filter, setFilter] = useState<'all' | 'insights' | 'alerts'>('all');
  const [agentInsights, setAgentInsights] = useState<FinancialInsight[]>([]);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    const runAgents = async () => {
      const state = {
        accounts,
        transactions,
        categories,
        cards,
        goals,
        budgets,
        bills,
        receivables,
        recurring: recurringTransactions,
        subscriptions,
        investments
      };
      const res = await agentService.analyze(state, 'PERIODIC_CHECK');
      setAgentInsights(res);
    };
    runAgents();
  }, [accounts, transactions, categories, cards, bills, receivables, recurringTransactions, subscriptions, investments, goals, budgets]);

  const handleDismissInsight = (id: string) => {
    agentService.dismissInsight(id);
    setAgentInsights(prev => prev.filter(i => i.id !== id));
  };

  const getPriorityBadge = (priority: InsightPriority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-negative/12 text-negative border-negative/25';
      case 'HIGH':     return 'bg-warning/12 text-warning border-warning/25';
      case 'MEDIUM':   return 'bg-accent/12 text-accent-text border-accent/25';
      case 'LOW':
      default:         return 'bg-positive/12 text-positive border-positive/25';
    }
  };

  /* Sem esta guarda a página desenhava o estado vazio antes de o IndexedDB
     responder — e uma falha de leitura ficava idêntica a "não há dados". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Feed de Inteligência</h1>
          <p className="label-xs mt-0.5">Insights proativos gerados pelos seus agentes locais.</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={() => markAllAlertsAsRead()}
            className="flex items-center space-x-1.5 text-xs font-semibold text-accent-text hover:underline"
          >
            <CheckCheck size={14} />
            <span>Limpar alertas</span>
          </button>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'Tudo' },
          { key: 'insights', label: `Agentes (${agentInsights.length})` },
          { key: 'alerts', label: `Sistema (${alerts.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === t.key
                ? 'bg-accent text-on-accent'
                : 'bg-surface-raised border border-edge text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INSIGHTS FEED DE AGENTES PROATIVOS ── */}
      {(filter === 'all' || filter === 'insights') && agentInsights.length > 0 && (
        <div className="space-y-3 stagger">
          {agentInsights.map(insight => {
            const isExpanded = expandedInsightId === insight.id;

            return (
              <div key={insight.id} className="card p-4 space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-xl bg-accent/15 text-accent-text flex items-center justify-center text-xs font-bold shrink-0">
                      <Sparkles size={14} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">{insight.title}</p>
                      <p className="label-xs text-ink-muted">{insight.agentName} • {insight.category || 'Geral'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getPriorityBadge(insight.priority)}`}>
                    {insight.priority}
                  </span>
                </div>

                <p className="text-sm text-ink leading-relaxed">{insight.summary}</p>

                {/* Explainability section */}
                {isExpanded && (
                  <div className="p-3 bg-surface-raised rounded-xl border border-active text-xs text-ink-muted space-y-1 animate-fade-in">
                    <p className="font-semibold text-ink flex items-center space-x-1">
                      <Info size={12} className="text-accent-text" />
                      <span>Por que estou vendo isso?</span>
                    </p>
                    <p className="leading-relaxed">{insight.explanation}</p>
                    <p className="text-[11px] text-ink-faint pt-1">Confiança da Análise: {insight.confidence}</p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-edge-strong">
                  <button
                    onClick={() => setExpandedInsightId(isExpanded ? null : insight.id)}
                    className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center space-x-1"
                  >
                    <Info size={12} />
                    <span>{isExpanded ? 'Ocultar detalhes' : 'Por que estou vendo isso?'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDismissInsight(insight.id)}
                      className="p-1 text-ink-faint hover:text-negative transition-colors"
                      title="Dispensar insight"
                    >
                      <EyeOff size={14} />
                    </button>

                    {insight.actionUrl && (
                      <button
                        onClick={() => navigate(insight.actionUrl!)}
                        className="px-3 py-1 rounded-full bg-accent text-on-accent text-xs font-bold flex items-center space-x-1 hover:bg-accent-hover transition-all"
                      >
                        <span>{insight.actionLabel || 'Ver'}</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* ── ALERTAS DO SISTEMA ── */}
      {(filter === 'all' || filter === 'alerts') && alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Bell size={13} className="text-ink-faint" />
            <h2 className="label-xs font-bold uppercase tracking-wider text-ink-faint">Alertas do sistema</h2>
          </div>
          <div className="space-y-2 stagger">
            {alerts.map(alert => {
              const visual = ALERT_VISUALS[alert.type] ?? ALERT_VISUALS.system;
              const Icon = visual.icon;
              const isExpanded = expandedAlertId === alert.id;
              const isUnread = !alert.isRead;

              return (
                <div
                  key={alert.id}
                  className={`card p-3.5 flex items-start gap-3 transition-colors ${isUnread ? 'border-l-2 border-l-accent' : ''} ${isUnread ? 'bg-surface-raised' : ''}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ALERT_TONE[visual.tone]}`}>
                    <Icon size={15} />
                  </span>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs ${isUnread ? 'font-bold text-ink' : 'font-semibold text-ink-muted'}`}>
                        {alert.title}
                        {isUnread && <span className="sr-only"> (não lido)</span>}
                      </p>
                      <time className="text-[11px] text-ink-faint shrink-0">{formatAlertDate(alert.date)}</time>
                    </div>
                    <p className="text-sm text-ink-muted leading-relaxed">{alert.message}</p>

                    {isExpanded && (
                      <p className="text-xs text-ink-faint leading-relaxed animate-fade-in">
                        {visual.why}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-0.5">
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        aria-expanded={isExpanded}
                        className="text-xs font-semibold text-accent-text hover:underline inline-flex items-center gap-1"
                      >
                        <Info size={11} />
                        <span>Por que estou vendo isso?</span>
                      </button>

                      {(alert.actionUrl || visual.href) && (
                        <button
                          onClick={() => {
                            const url = alert.actionUrl || visual.href;
                            if (isUnread) void markAlertAsRead(alert.id);
                            if (url) navigate(url);
                          }}
                          className="text-xs font-semibold text-accent-text hover:underline inline-flex items-center gap-1"
                        >
                          <span>{visual.action}</span>
                          <ArrowRight size={11} />
                        </button>
                      )}

                      {isUnread && (
                        <button
                          onClick={() => void markAlertAsRead(alert.id)}
                          className="text-xs font-semibold text-ink-faint hover:text-ink hover:underline"
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {agentInsights.length === 0 && alerts.length === 0 && (
        <div className="card p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-raised text-positive flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-xs font-bold text-ink">Tudo sob controle!</p>
          <p className="label-xs max-w-xs mx-auto">Seus agentes monitoraram todas as suas contas, faturas e orçamentos e não encontraram problemas pendentes.</p>
        </div>
      )}

    </div>
  );
};
