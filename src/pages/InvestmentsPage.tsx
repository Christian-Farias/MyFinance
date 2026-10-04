import React, { useState } from 'react';
import { Plus, TrendingUp, Sparkles, Trash2, Edit2 } from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { ErrorState, LoadingState } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { InvestmentModal } from '../components/modals/InvestmentModal';
import { formatCurrency } from '../calculations/financialCalculations';
import type { Investment } from '../types';

export const InvestmentsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { investments, deleteInvestment } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | undefined>(undefined);

  const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
  const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalProfit = currentValue - totalInvested;
  const overallYield = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const typeMap: { [key: string]: { label: string; color: string; total: number } } = {
    fixed_income: { label: 'Renda fixa', color: 'var(--color-info)', total: 0 },
    stocks:       { label: 'Ações',      color: 'var(--color-accent)', total: 0 },
    crypto:       { label: 'Cripto',     color: 'var(--color-warning)', total: 0 },
    funds:        { label: 'Fundos',     color: 'var(--color-positive)', total: 0 },
    etfs:         { label: 'ETFs',       color: 'var(--color-info)', total: 0 },
    other:        { label: 'Outros',     color: 'var(--color-ink-muted)', total: 0 },
  };

  investments.forEach(inv => {
    if (typeMap[inv.type]) {
      typeMap[inv.type].total += inv.currentValue;
    } else {
      typeMap.other.total += inv.currentValue;
    }
  });

  const chartData = Object.values(typeMap)
    .filter(item => item.total > 0)
    .map(item => ({
      name: item.label,
      value: item.total,
      percentage: currentValue > 0 ? (item.total / currentValue) * 100 : 0,
      color: item.color,
    }));

  const dominantAsset = [...chartData].sort((a, b) => b.value - a.value)[0];

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
        <h1 className="text-xl font-bold text-ink tracking-tight">Investimentos</h1>
        <button
          onClick={() => { setInvestmentToEdit(undefined); setIsModalOpen(true); }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Novo ativo</span>
        </button>
      </div>

      {/* ── PORTFOLIO SUMMARY ── */}
      <div className="card p-5">
        <p className="label-xs mb-2">Patrimônio investido</p>
        <p className="num-xl mb-3">{formatCurrency(currentValue)}</p>
        <div className="flex items-center space-x-2">
          <div className={`pill ${totalProfit >= 0 ? 'pill-positive' : 'pill-negative'}`}>
            <TrendingUp size={10} />
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </div>
          <div className={`pill ${overallYield >= 0 ? 'pill-positive' : 'pill-negative'}`}>
            {overallYield >= 0 ? '+' : ''}{overallYield.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* ── ALLOCATION ── */}
      <div className="card p-5">
        <p className="label-section mb-4">Alocação da carteira</p>
        {chartData.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-ink-faint">Nenhum investimento cadastrado na carteira.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--color-on-accent)" strokeWidth={2} />
                    ))}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-ink font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-ink font-semibold">{item.percentage.toFixed(0)}%</span>
                    <span className="text-ink-muted">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI INSIGHT ── */}
      {dominantAsset && (
        <div className="card p-4 flex items-center space-x-3.5" style={{ borderLeft: '3px solid var(--color-accent)' }}>
          <div className="w-9 h-9 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="label-xs text-accent block mb-0.5">Insight</span>
            <p className="text-xs text-ink">
              Sua maior exposição está em {dominantAsset.name.toLowerCase()} ({dominantAsset.percentage.toFixed(0)}%).
            </p>
          </div>
        </div>
      )}

      {/* ── ASSETS LIST ── */}
      <div>
        <p className="label-section mb-3 px-0.5">Seus ativos ({investments.length})</p>

        {investments.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={28} className="text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-ink mb-2">Nenhum ativo cadastrado</h3>
            <p className="label-xs leading-relaxed mb-5">Adicione seus investimentos para acompanhar a evolução.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:bg-accent transition-colors"
            >
              Adicionar ativo
            </button>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {investments.map(inv => {
              const isProfit = inv.yieldPercentage >= 0;
              return (
                <div
                  key={inv.id}
                  className="animate-fade-in card p-4 flex items-center justify-between group card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <h4 className="text-xs font-bold text-ink truncate">{inv.assetName}</h4>
                      {inv.ticker && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg bg-edge text-ink-muted">
                          {inv.ticker}
                        </span>
                      )}
                    </div>
                    <span className="label-xs">
                      {inv.institution} · {inv.quantity} unid. a {formatCurrency(inv.averagePrice)}
                    </span>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs font-bold text-ink">{formatCurrency(inv.currentValue)}</div>
                    <span className={`text-[11px] font-semibold ${isProfit ? 'text-positive' : 'text-negative'}`}>
                      {isProfit ? '+' : ''}{inv.yieldPercentage.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setInvestmentToEdit(inv); setIsModalOpen(true); }}
                      className="w-8 h-8 rounded-lg bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
                      title="Editar"
                      aria-label={`Editar investimento ${inv.assetName}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteInvestment(inv.id)}
                      className="w-8 h-8 rounded-lg bg-surface-raised text-negative/60 hover:text-negative flex items-center justify-center transition-colors"
                      title="Excluir"
                      aria-label={`Excluir investimento ${inv.assetName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        investmentToEdit={investmentToEdit}
      />
    </div>
  );
};
