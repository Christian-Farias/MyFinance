import React, { useState } from 'react';
import { Plus, TrendingUp, Sparkles, Trash2, Edit2 } from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { InvestmentModal } from '../components/modals/InvestmentModal';
import { formatCurrency } from '../calculations/financialCalculations';
import type { Investment } from '../types';

export const InvestmentsPage: React.FC = () => {
  const { investments, deleteInvestment } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | undefined>(undefined);

  const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
  const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalProfit = currentValue - totalInvested;
  const overallYield = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const typeMap: { [key: string]: { label: string; color: string; total: number } } = {
    fixed_income: { label: 'Renda fixa', color: '#3B82F6', total: 0 },
    stocks:       { label: 'Ações',      color: '#8B7CFF', total: 0 },
    crypto:       { label: 'Cripto',     color: '#F59E0B', total: 0 },
    funds:        { label: 'Fundos',     color: '#39D98A', total: 0 },
    etfs:         { label: 'ETFs',       color: '#06B6D4', total: 0 },
    other:        { label: 'Outros',     color: '#8B919B', total: 0 },
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

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Investimentos</h1>
        <button
          onClick={() => { setInvestmentToEdit(undefined); setIsModalOpen(true); }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 text-[#8B7CFF] text-xs font-semibold hover:bg-[#8B7CFF]/15 transition-colors"
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
            <p className="text-xs text-[#5F6570]">Nenhum investimento cadastrado na carteira.</p>
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
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0A0B0E" strokeWidth={2} />
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
                    <span className="text-[#F5F5F5] font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#F5F5F5] font-semibold">{item.percentage.toFixed(0)}%</span>
                    <span className="text-[#8B919B]">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI INSIGHT ── */}
      {dominantAsset && (
        <div className="card p-4 flex items-center space-x-3.5" style={{ borderLeft: '3px solid #8B7CFF' }}>
          <div className="w-9 h-9 rounded-2xl bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="label-xs text-[#8B7CFF] block mb-0.5">Insight</span>
            <p className="text-xs text-[#F5F5F5]">
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
            <div className="w-14 h-14 rounded-3xl bg-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={28} className="text-[#8B7CFF]" />
            </div>
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">Nenhum ativo cadastrado</h3>
            <p className="label-xs leading-relaxed mb-5">Adicione seus investimentos para acompanhar a evolução.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#8B7CFF] text-white text-xs font-semibold hover:bg-[#7B6CEF] transition-colors"
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
                      <h4 className="text-xs font-bold text-[#F5F5F5] truncate">{inv.assetName}</h4>
                      {inv.ticker && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg bg-[#1D2026] text-[#8B919B]">
                          {inv.ticker}
                        </span>
                      )}
                    </div>
                    <span className="label-xs">
                      {inv.institution} · {inv.quantity} unid. a {formatCurrency(inv.averagePrice)}
                    </span>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs font-bold text-[#F5F5F5]">{formatCurrency(inv.currentValue)}</div>
                    <span className={`text-[11px] font-semibold ${isProfit ? 'text-[#39D98A]' : 'text-[#FF5C5C]'}`}>
                      {isProfit ? '+' : ''}{inv.yieldPercentage.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setInvestmentToEdit(inv); setIsModalOpen(true); }}
                      className="p-1.5 rounded-lg bg-[#121419] text-[#8B919B] hover:text-[#F5F5F5] transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deleteInvestment(inv.id)}
                      className="p-1.5 rounded-lg bg-[#121419] text-[#FF5C5C]/50 hover:text-[#FF5C5C] transition-colors"
                    >
                      <Trash2 size={13} />
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
