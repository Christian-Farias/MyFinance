import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, TrendingUp, Sliders, CreditCard, Layers, CheckCircle2, Clock, CheckCheck, AlertTriangle, ArrowRight, Info, EyeOff, Bot, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { agentService } from '../financialAgents/agentService';
import type { FinancialInsight, InsightPriority } from '../financialAgents/agentTypes';
import type { SmartAlert, AlertType } from '../types';

const ALERT_VISUALS: Record<AlertType, { icon: React.ElementType; color: string; bgColor: string; why: string; action: string }> = {
  expense_spike: { icon: TrendingUp,    color: '#FF5C5C', bgColor: '#FF5C5C15', why: 'Seus gastos estão acima do padrão.',      action: 'Ver gastos'     },
  budget:        { icon: Sliders,       color: '#F59E0B', bgColor: '#F59E0B15', why: 'Você está próximo do seu limite mensal.',  action: 'Ver orçamentos' },
  invoice:       { icon: CreditCard,    color: '#8B7CFF', bgColor: '#8B7CFF15', why: 'Fatura com vencimento se aproximando.',   action: 'Ver cartões'    },
  installment:   { icon: Layers,        color: '#EC4899', bgColor: '#EC489915', why: 'Parcela próxima do vencimento.',          action: 'Ver cartões'    },
  saving:        { icon: CheckCircle2,  color: '#39D98A', bgColor: '#39D98A15', why: 'Você está progredindo bem nas economias.', action: 'Ver metas'     },
  goal:          { icon: CheckCircle2,  color: '#39D98A', bgColor: '#39D98A15', why: 'Meta com atualização disponível.',        action: 'Ver metas'      },
  duplicate:             { icon: AlertTriangle, color: '#F59E0B', bgColor: '#F59E0B15', why: 'Possível lançamento duplicado detectado.', action: 'Ver transações' },
  bill_due:              { icon: Clock,         color: '#FF5C5C', bgColor: '#FF5C5C15', why: 'Conta com vencimento próximo.',          action: 'Ver compromissos' },
  receivable_due:        { icon: CheckCircle2,  color: '#39D98A', bgColor: '#39D98A15', why: 'Recebimento previsto para breve.',       action: 'Ver compromissos' },
  projected_balance_low: { icon: AlertTriangle, color: '#F59E0B', bgColor: '#F59E0B15', why: 'Risco de saldo baixo nos próximos dias.',  action: 'Ver fluxo de caixa' },
  system:        { icon: Bell,          color: '#8B7CFF', bgColor: '#8B7CFF15', why: 'Notificação do sistema.',                 action: 'Saiba mais'     },
};

export const AlertsPage: React.FC = () => {
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
  }, [accounts, transactions, bills, goals, budgets]);

  const handleDismissInsight = (id: string) => {
    agentService.dismissInsight(id);
    setAgentInsights(prev => prev.filter(i => i.id !== id));
  };

  const getPriorityBadge = (priority: InsightPriority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-[#FF5C5C20] text-[#FF5C5C] border-[#FF5C5C40]';
      case 'HIGH':     return 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B40]';
      case 'MEDIUM':   return 'bg-[#8B7CFF20] text-[#8B7CFF] border-[#8B7CFF40]';
      case 'LOW':
      default:         return 'bg-[#39D98A20] text-[#39D98A] border-[#39D98A40]';
    }
  };

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Feed de Inteligência</h1>
          <p className="label-xs mt-0.5">Insights proativos gerados pelos seus agentes locais.</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={() => markAllAlertsAsRead()}
            className="flex items-center space-x-1.5 text-xs font-semibold text-[#8B7CFF] hover:underline"
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
                ? 'bg-[#8B7CFF] text-white shadow-sm shadow-[#8B7CFF]/20'
                : 'bg-[#121419] border border-[#1D2026] text-[#8E95A3] hover:text-[#F5F5F5]'
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
                    <span className="w-7 h-7 rounded-xl bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center text-xs font-bold shrink-0">
                      <Sparkles size={14} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#F5F5F5]">{insight.title}</p>
                      <p className="label-xs text-[#8E95A3]">{insight.agentName} • {insight.category || 'Geral'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getPriorityBadge(insight.priority)}`}>
                    {insight.priority}
                  </span>
                </div>

                <p className="text-xs text-[#D1D5DB] leading-relaxed">{insight.summary}</p>

                {/* Explainability section */}
                {isExpanded && (
                  <div className="p-3 bg-[#121419] rounded-xl border border-[#222733] text-[11px] text-[#8E95A3] space-y-1 animate-fade-in">
                    <p className="font-semibold text-white flex items-center space-x-1">
                      <Info size={12} className="text-[#8B7CFF]" />
                      <span>Por que estou vendo isso?</span>
                    </p>
                    <p className="leading-relaxed">{insight.explanation}</p>
                    <p className="text-[10px] text-[#5F6570] pt-1">Confiança da Análise: {insight.confidence}</p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1F2430]">
                  <button
                    onClick={() => setExpandedInsightId(isExpanded ? null : insight.id)}
                    className="text-[11px] font-semibold text-[#8E95A3] hover:text-white flex items-center space-x-1"
                  >
                    <Info size={12} />
                    <span>{isExpanded ? 'Ocultar detalhes' : 'Por que estou vendo isso?'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDismissInsight(insight.id)}
                      className="p-1 text-[#5F6570] hover:text-[#FF5C5C] transition-colors"
                      title="Dispensar insight"
                    >
                      <EyeOff size={14} />
                    </button>

                    {insight.actionUrl && (
                      <button
                        onClick={() => navigate(insight.actionUrl!)}
                        className="px-3 py-1 rounded-xl bg-[#8B7CFF] text-white text-[11px] font-bold flex items-center space-x-1 hover:bg-[#7B6CEF] transition-all"
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

      {/* Empty State */}
      {agentInsights.length === 0 && alerts.length === 0 && (
        <div className="card p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121419] text-[#39D98A] flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-xs font-bold text-white">Tudo sob controle!</p>
          <p className="label-xs max-w-xs mx-auto">Seus agentes monitoraram todas as suas contas, faturas e orçamentos e não encontraram problemas pendentes.</p>
        </div>
      )}

    </div>
  );
};
