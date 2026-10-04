import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { calculateProjectedCashFlow, formatCurrency, formatDateBR } from '../calculations/financialCalculations';

export const CashFlowPage: React.FC = () => {
  const { 
    accounts, 
    transactions, 
    bills, 
    receivables, 
    recurringTransactions 
  } = useFinance();

  const cashFlow = useMemo(() => {
    return calculateProjectedCashFlow(
      accounts,
      transactions,
      bills,
      receivables,
      recurringTransactions,
      30
    );
  }, [accounts, transactions, bills, receivables, recurringTransactions]);

  const chartData = useMemo(() => {
    return cashFlow.points.map(pt => ({
      label: pt.label,
      date: pt.date,
      balance: pt.projectedBalance,
      inflows: pt.inflows,
      outflows: pt.outflows,
    }));
  }, [cashFlow]);

  // Points with movements
  const daysWithMovements = useMemo(() => {
    return cashFlow.points.filter(pt => pt.items.length > 0);
  }, [cashFlow]);

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">
      {/* ── HEADER ── */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Fluxo de Caixa & Saldo Projetado</h1>
        <p className="label-xs text-[#8E95A3] mt-0.5">Previsão financeira dos próximos 30 dias</p>
      </div>

      {/* ── LOW BALANCE ALERT IF PRESENT ── */}
      {cashFlow.hasLowBalanceRisk ? (
        <div className="card p-4 border-[#FF5555]/30 bg-[#2A1215] flex items-start space-x-3.5">
          <AlertTriangle size={20} className="text-[#FF5555] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#FF5555]">Atenção: Risco de Saldo Baixo</h4>
            <p className="text-xs text-[#F5F5F5] mt-1 leading-relaxed">
              Seu saldo projetado pode atingir a mínima de **{formatCurrency(cashFlow.lowestProjectedBalance)}** em **{formatDateBR(cashFlow.lowestBalanceDate)}** antes da entrada dos próximos recebimentos.
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-4 border-[#39D98A]/20 bg-[#39D98A]/5 flex items-center space-x-3.5">
          <ShieldCheck size={20} className="text-[#39D98A] shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-[#39D98A]">Fluxo de Caixa Saudável</h4>
            <p className="text-xs text-[#8E95A3] mt-0.5">
              Seu saldo projetado permanece positivo durante todo o período previsto (mínima de {formatCurrency(cashFlow.lowestProjectedBalance)}).
            </p>
          </div>
        </div>
      )}

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="card p-3.5">
          <span className="label-xs text-[#8E95A3]">Saldo Hoje</span>
          <div className="text-base font-bold text-white mt-1">{formatCurrency(cashFlow.initialBalance)}</div>
          <span className="text-[10px] text-[#8E95A3]">Em todas as contas</span>
        </div>

        <div className="card p-3.5">
          <span className="label-xs text-[#39D98A]">Entradas Previstas</span>
          <div className="text-base font-bold text-[#39D98A] mt-1">+{formatCurrency(cashFlow.totalInflows)}</div>
          <span className="text-[10px] text-[#8E95A3]">Próximos 30 dias</span>
        </div>

        <div className="card p-3.5">
          <span className="label-xs text-[#FF5555]">Saídas Previstas</span>
          <div className="text-base font-bold text-[#FF5555] mt-1">-{formatCurrency(cashFlow.totalOutflows)}</div>
          <span className="text-[10px] text-[#8E95A3]">Contas e despesas</span>
        </div>

        <div className="card p-3.5">
          <span className="label-xs text-[#8B7CFF]">Saldo Projetado</span>
          <div className="text-base font-bold text-[#8B7CFF] mt-1">{formatCurrency(cashFlow.projectedEndBalance)}</div>
          <span className="text-[10px] text-[#8E95A3]">Estimativa em 30 dias</span>
        </div>
      </div>

      {/* ── PROJECTED BALANCE CHART ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Evolução do Saldo Projetado</h3>
            <p className="label-xs text-[#8E95A3]">Projeção calculada dia a dia</p>
          </div>
          <span className="pill pill-purple text-[10px]">30 dias</span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B7CFF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B7CFF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#8E95A3', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#8E95A3', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#14171D', 
                  borderColor: '#222733', 
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Saldo Projetado']}
                labelFormatter={(lbl, payload) => payload?.[0]?.payload?.date ? formatDateBR(payload[0].payload.date) : lbl}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#8B7CFF" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#balanceGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── UPCOMING TIMELINE MOVEMENTS ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white">Eventos Financeiros Previstos</h3>
          <span className="label-xs text-[#8E95A3]">Próximos 30 dias</span>
        </div>

        {daysWithMovements.length === 0 ? (
          <div className="card p-6 text-center text-[#8E95A3]">
            <Calendar size={32} className="mx-auto mb-2 opacity-30 text-[#8B7CFF]" />
            <p className="text-xs">Nenhum evento financeiro agendado para o período.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daysWithMovements.map(day => (
              <div key={day.date} className="card p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#222733] pb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-[#8B7CFF]" />
                    <span className="text-xs font-bold text-white">{formatDateBR(day.date)}</span>
                  </div>
                  <span className="text-[11px] text-[#8E95A3] font-medium">
                    Saldo ao fim do dia: <strong className="text-white">{formatCurrency(day.projectedBalance)}</strong>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {day.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {item.type === 'inflow' ? (
                          <ArrowUpRight size={14} className="text-[#39D98A]" />
                        ) : (
                          <ArrowDownLeft size={14} className="text-[#FF5555]" />
                        )}
                        <span className="text-[#F5F5F5]">{item.description}</span>
                      </div>
                      <span className={`font-semibold ${item.type === 'inflow' ? 'text-[#39D98A]' : 'text-[#FF5555]'}`}>
                        {item.type === 'inflow' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
