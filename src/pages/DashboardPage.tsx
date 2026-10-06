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
  Plus,
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
} from '../calculations/financialCalculations';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';
import { usePageData } from '../hooks/usePageData';

/* ─── Greeting helper ─── */
function getGreeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}


      {/* ── PATRIMÔNIO ──
          O objeto principal da tela. O valor é o único elemento em
          escala .num-hero e fica sozinho na primeira faixa; a
          sparkline perdeu altura e-opacity porque é contexto, não
          informação. As três métricas abaixo são filhas do
          patrimônio, então compartilham a mesma divisória. */}
      <div className="mt-6">
        <p className="label-section mb-2">SEU PATRIMÔNIO</p>

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
        <div className="h-8 w-full mt-3 mb-5 opacity-40" aria-hidden="true">
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
      <div className="border-t border-edge pt-6 mt-10">
        <div className="flex items-center justify-between mb-4">
          <p className="label-section">RESUMO DO MÊS</p>
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
        className="w-full text-left rounded-2xl p-5 bg-surface border border-edge card-hover mt-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="label-section">INSIGHT DO MÊS</span>
              <Sparkles size={14} className="shrink-0" style={{ color: insightBorderColor }} aria-hidden="true" />
            </div>
            <p className="text-[15px] font-semibold text-ink leading-snug mb-1.5">
              {insight.emoji} {insight.headline}
            </p>
            <p className="text-sm text-ink-muted leading-relaxed">{insight.sub}</p>
          </div>
          <ChevronRight size={16} className="text-ink-faint shrink-0 mt-0.5" aria-hidden="true" />
        </div>
        <span className="mt-4 inline-block text-xs font-semibold text-accent-text">
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
      <div className="border-t border-edge pt-6 mt-10">
        <p className="label-section mb-4">AÇÕES RÁPIDAS</p>
        <div className="grid grid-cols-4 gap-1">
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
                className="flex flex-col items-center gap-2 py-3 px-1 min-w-0 min-h-[56px] rounded-xl hover:bg-surface transition-colors"
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
