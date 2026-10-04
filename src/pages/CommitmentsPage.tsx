import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  CreditCard, 
  Repeat, 
  Tv, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  Trash2, 
  Edit2, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateBR, formatRelativeDate, calculateSubscriptionsSummary, calculateFixedVsVariableExpenses } from '../calculations/financialCalculations';
import { BillModal } from '../components/modals/BillModal';
import { ReceivableModal } from '../components/modals/ReceivableModal';
import { RecurringModal } from '../components/modals/RecurringModal';
import type { Bill, Receivable, RecurringTransaction, Subscription } from '../types';

export const CommitmentsPage: React.FC = () => {
  const { 
    bills, 
    receivables, 
    recurringTransactions, 
    subscriptions, 
    transactions,
    accounts,
    markBillAsPaid, 
    markReceivableAsReceived,
    deleteBill,
    deleteReceivable,
    deleteRecurring,
    skipRecurringOccurrence,
    deleteSubscription,
    selectedPeriod
  } = useFinance();

  const [tab, setTab] = useState<'bills' | 'receivables' | 'subscriptions' | 'recurring'>('bills');
  
  // Modals state
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | undefined>(undefined);

  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [receivableToEdit, setReceivableToEdit] = useState<Receivable | undefined>(undefined);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | undefined>(undefined);

  // Quick Pay / Receive Confirmation
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Calculations
  const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue');
  const totalPendingBills = pendingBills.reduce((s, b) => s + b.amount, 0);

  const expectedReceivables = receivables.filter(r => r.status === 'expected' || r.status === 'delayed');
  const totalExpectedReceivables = expectedReceivables.reduce((s, r) => s + r.amount, 0);

  const subSummary = calculateSubscriptionsSummary(subscriptions);
  const fixedReport = calculateFixedVsVariableExpenses(transactions, recurringTransactions, bills, selectedPeriod);

  const handlePayBill = async (bill: Bill) => {
    try {
      setProcessingId(bill.id);
      await markBillAsPaid(bill.id, accounts[0]?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReceive = async (rec: Receivable) => {
    try {
      setProcessingId(rec.id);
      await markReceivableAsReceived(rec.id, accounts[0]?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Compromissos Financeiros</h1>
          <p className="label-xs text-[#8E95A3] mt-0.5">Contas a pagar, receitas previstas e assinaturas</p>
        </div>

        <button
          onClick={() => {
            if (tab === 'bills') { setBillToEdit(undefined); setIsBillModalOpen(true); }
            else if (tab === 'receivables') { setReceivableToEdit(undefined); setIsRecModalOpen(true); }
            else { setRecurringToEdit(undefined); setIsRecurringModalOpen(true); }
          }}
          className="btn-primary py-2 px-3 text-xs flex items-center space-x-1.5"
        >
          <Plus size={15} />
          <span>Novo</span>
        </button>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-[#FF5555]">A Pagar</span>
            <Clock size={14} className="text-[#FF5555]" />
          </div>
          <div>
            <div className="text-base font-bold text-white">{formatCurrency(totalPendingBills)}</div>
            <span className="text-[11px] text-[#8E95A3]">{pendingBills.length} pendente(s)</span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-[#39D98A]">A Receber</span>
            <ArrowUpRight size={14} className="text-[#39D98A]" />
          </div>
          <div>
            <div className="text-base font-bold text-white">{formatCurrency(totalExpectedReceivables)}</div>
            <span className="text-[11px] text-[#8E95A3]">{expectedReceivables.length} previsto(s)</span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-[#8B7CFF]">Assinaturas</span>
            <Tv size={14} className="text-[#8B7CFF]" />
          </div>
          <div>
            <div className="text-base font-bold text-white">{formatCurrency(subSummary.totalMonthlyEstimate)}</div>
            <span className="text-[11px] text-[#8E95A3]">/mês ({subSummary.activeCount} ativas)</span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-[#38BDF8]">Despesas Fixas</span>
            <Repeat size={14} className="text-[#38BDF8]" />
          </div>
          <div>
            <div className="text-base font-bold text-white">{formatCurrency(fixedReport.fixedExpensesTotal)}</div>
            <span className="text-[11px] text-[#8E95A3]">{fixedReport.fixedPercentage.toFixed(0)}% dos gastos</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#0D0F12] border border-[#222733] rounded-2xl">
        {[
          { key: 'bills', label: 'Contas', count: pendingBills.length },
          { key: 'receivables', label: 'Receber', count: expectedReceivables.length },
          { key: 'subscriptions', label: 'Assinaturas', count: subscriptions.length },
          { key: 'recurring', label: 'Recorrências', count: recurringTransactions.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all ${
              tab === key 
                ? 'bg-[#14171D] text-white shadow-sm border border-[#222733]' 
                : 'text-[#8E95A3] hover:text-white'
            }`}
          >
            <span>{label}</span>
            {count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#222733] text-white">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT: CONTAS A PAGAR ── */}
      {tab === 'bills' && (
        <div className="space-y-3">
          {bills.length === 0 ? (
            <div className="card p-8 text-center text-[#8E95A3]">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-[#39D98A]/50" />
              <p className="text-sm font-semibold text-white">Nenhuma conta cadastrada</p>
              <p className="text-xs mt-1">Cadastre seus boletos e pagamentos periódicos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bills.map(bill => {
                const isPaid = bill.status === 'paid';
                const isOverdue = bill.status === 'overdue' || (bill.status === 'pending' && bill.dueDate < new Date().toISOString().split('T')[0]);

                return (
                  <div 
                    key={bill.id}
                    className={`card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isPaid ? 'opacity-60 bg-[#121419]' : 'hover:border-[#333A4D]'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isPaid ? 'bg-[#39D98A]/15 text-[#39D98A]' : isOverdue ? 'bg-[#FF5555]/15 text-[#FF5555]' : 'bg-[#1A1F29] text-[#8E95A3]'
                      }`}>
                        {isPaid ? <Check size={18} /> : <Calendar size={18} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-semibold truncate ${isPaid ? 'line-through text-[#8E95A3]' : 'text-white'}`}>
                            {bill.description}
                          </h4>
                          {bill.isFixedExpense && (
                            <span className="pill pill-neutral text-[9px] py-0 px-1.5">Fixo</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 text-xs text-[#8E95A3]">
                          <span>Vencimento: {formatDateBR(bill.dueDate)} ({formatRelativeDate(bill.dueDate)})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1D2026]">
                      <span className={`text-sm font-bold ${isPaid ? 'text-[#8E95A3]' : 'text-white'}`}>
                        {formatCurrency(bill.amount)}
                      </span>

                      <div className="flex items-center space-x-2">
                        {!isPaid ? (
                          <button
                            onClick={() => handlePayBill(bill)}
                            disabled={processingId === bill.id}
                            className="py-1.5 px-3 rounded-xl bg-[#39D98A]/15 hover:bg-[#39D98A]/25 text-[#39D98A] text-xs font-semibold flex items-center space-x-1 transition-all min-h-[36px]"
                          >
                            <Check size={13} />
                            <span>Pagar</span>
                          </button>
                        ) : (
                          <span className="pill pill-positive text-[10px]">Pago</span>
                        )}

                        <button
                          onClick={() => { setBillToEdit(bill); setIsBillModalOpen(true); }}
                          className="w-8 h-8 rounded-lg text-[#8E95A3] hover:text-white flex items-center justify-center"
                          aria-label={`Editar conta ${bill.description}`}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: CONTAS A RECEBER ── */}
      {tab === 'receivables' && (
        <div className="space-y-3">
          {receivables.length === 0 ? (
            <div className="card p-8 text-center text-[#8E95A3]">
              <ArrowUpRight size={36} className="mx-auto mb-2 text-[#39D98A]/50" />
              <p className="text-sm font-semibold text-white">Nenhum recebimento previsto</p>
              <p className="text-xs mt-1">Adicione salários, reembolsos e receitas futuras.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {receivables.map(rec => {
                const isReceived = rec.status === 'received';
                return (
                  <div 
                    key={rec.id}
                    className={`card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isReceived ? 'opacity-60 bg-[#121419]' : 'hover:border-[#333A4D]'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isReceived ? 'bg-[#39D98A]/15 text-[#39D98A]' : 'bg-[#1A1F29] text-[#39D98A]'
                      }`}>
                        <ArrowUpRight size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-semibold truncate ${isReceived ? 'line-through text-[#8E95A3]' : 'text-white'}`}>
                          {rec.description}
                        </h4>
                        <p className="text-xs text-[#8E95A3] mt-0.5">
                          Previsto: {formatDateBR(rec.expectedDate)} ({formatRelativeDate(rec.expectedDate)})
                          {rec.origin && ` • ${rec.origin}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1D2026]">
                      <span className="text-sm font-bold text-[#39D98A]">
                        +{formatCurrency(rec.amount)}
                      </span>

                      <div className="flex items-center space-x-2">
                        {!isReceived ? (
                          <button
                            onClick={() => handleReceive(rec)}
                            disabled={processingId === rec.id}
                            className="py-1.5 px-3 rounded-xl bg-[#39D98A] text-[#0D0F12] text-xs font-bold flex items-center space-x-1 shadow-sm transition-all min-h-[36px]"
                          >
                            <Check size={13} />
                            <span>Receber</span>
                          </button>
                        ) : (
                          <span className="pill pill-positive text-[10px]">Recebido</span>
                        )}

                        <button
                          onClick={() => { setReceivableToEdit(rec); setIsRecModalOpen(true); }}
                          className="w-8 h-8 rounded-lg text-[#8E95A3] hover:text-white flex items-center justify-center"
                          aria-label={`Editar recebimento ${rec.description}`}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: ASSINATURAS ── */}
      {tab === 'subscriptions' && (
        <div className="space-y-3">
          <div className="card p-4 flex items-center justify-between border-[#8B7CFF]/20 bg-[#8B7CFF]/5">
            <div className="flex items-center space-x-3">
              <Tv size={20} className="text-[#8B7CFF]" />
              <div>
                <h4 className="text-xs font-bold text-white">Impacto Anual das Assinaturas</h4>
                <p className="text-[11px] text-[#8E95A3]">Economizar cancelando serviços ociosos</p>
              </div>
            </div>
            <span className="text-sm font-bold text-[#8B7CFF]">{formatCurrency(subSummary.totalAnnualEstimate)}/ano</span>
          </div>

          <div className="space-y-2">
            {subscriptions.map(sub => (
              <div key={sub.id} className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center shrink-0">
                    <Tv size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate">{sub.name}</h4>
                    <p className="text-xs text-[#8E95A3] mt-0.5">
                      Próxima cobrança: {formatDateBR(sub.nextBillingDate)} • {formatCurrency(sub.annualEstimate)}/ano
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1D2026]">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-bold text-white block">{formatCurrency(sub.amount)}</span>
                    <span className="text-[10px] text-[#8E95A3] font-medium">{sub.frequency}</span>
                  </div>

                  <button
                    onClick={() => deleteSubscription(sub.id)}
                    className="w-8 h-8 rounded-lg text-[#8E95A3] hover:text-[#FF5555] flex items-center justify-center transition-colors"
                    aria-label={`Excluir assinatura ${sub.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: RECORRÊNCIAS ── */}
      {tab === 'recurring' && (
        <div className="space-y-2">
          {recurringTransactions.map(rule => (
            <div key={rule.id} className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  rule.type === 'income' ? 'bg-[#39D98A]/15 text-[#39D98A]' : 'bg-[#FF5555]/15 text-[#FF5555]'
                }`}>
                  <Repeat size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-white truncate">{rule.description}</h4>
                    <span className="pill pill-neutral text-[9px] py-0 px-1.5">{rule.frequency}</span>
                  </div>
                  <p className="text-xs text-[#8E95A3] mt-0.5">
                    Próxima ocorrência: {formatDateBR(rule.nextOccurrence)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1D2026]">
                <span className={`text-sm font-bold ${rule.type === 'income' ? 'text-[#39D98A]' : 'text-white'}`}>
                  {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => skipRecurringOccurrence(rule.id)}
                    className="py-1 px-2.5 rounded-lg bg-[#1A1F29] hover:bg-[#222733] text-[#8E95A3] text-xs font-semibold min-h-[32px]"
                  >
                    Pular
                  </button>

                  <button
                    onClick={() => { setRecurringToEdit(rule); setIsRecurringModalOpen(true); }}
                    className="w-8 h-8 rounded-lg text-[#8E95A3] hover:text-white flex items-center justify-center"
                    aria-label={`Editar regra ${rule.description}`}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <BillModal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} billToEdit={billToEdit} />
      <ReceivableModal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} receivableToEdit={receivableToEdit} />
      <RecurringModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} recurringToEdit={recurringToEdit} />
    </div>
  );
};
