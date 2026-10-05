import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Repeat,
  Tv,
  ArrowUpRight,
  Check,
  Trash2,
  Edit2,
} from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState, useToast } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { formatCurrency, formatDateBR, formatRelativeDate, calculateSubscriptionsSummary, calculateFixedVsVariableExpenses } from '../calculations/financialCalculations';
import { BillModal } from '../components/modals/BillModal';
import { ReceivableModal } from '../components/modals/ReceivableModal';
import { RecurringModal } from '../components/modals/RecurringModal';
import type { Bill, Receivable, RecurringTransaction } from '../types';

export const CommitmentsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
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

  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  /* deleteBill/deleteReceivable/deleteRecurring eram desestruturados e nunca
     chamados: as abas Contas, Receber e Recorrências não tinham como apagar.
     A exclusão de assinatura existia, porém sem confirmação. */
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'bill'; id: string; label: string }
    | { kind: 'receivable'; id: string; label: string }
    | { kind: 'recurring'; id: string; label: string }
    | { kind: 'subscription'; id: string; label: string }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setIsDeleting(true);
    try {
      if (target.kind === 'bill') await deleteBill(target.id);
      else if (target.kind === 'receivable') await deleteReceivable(target.id);
      else if (target.kind === 'recurring') await deleteRecurring(target.id);
      else await deleteSubscription(target.id);
      toast.success('Excluído com sucesso.');
      setPendingDelete(null);
    } catch {
      toast.error('Não foi possível excluir. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };
  
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
          <h1 className="text-2xl font-bold text-ink tracking-tight">Compromissos Financeiros</h1>
          <p className="label-xs text-ink-muted mt-0.5">Contas a pagar, receitas previstas e assinaturas</p>
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
            <span className="label-xs text-negative-strong">A Pagar</span>
            <Clock size={14} className="text-negative-strong" />
          </div>
          <div>
            <div className="text-base font-bold text-ink">{formatCurrency(totalPendingBills)}</div>
            <span className="text-xs text-ink-muted">{pendingBills.length} pendente(s)</span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-positive">A Receber</span>
            <ArrowUpRight size={14} className="text-positive" />
          </div>
          <div>
            <div className="text-base font-bold text-ink">{formatCurrency(totalExpectedReceivables)}</div>
            <span className="text-xs text-ink-muted">{expectedReceivables.length} previsto(s)</span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-accent">Assinaturas</span>
            <Tv size={14} className="text-accent" />
          </div>
          <div>
            <div className="text-base font-bold text-ink">{formatCurrency(subSummary.totalMonthlyEstimate)}</div>
            <span className="text-xs text-ink-muted">/mês ({subSummary.activeCount} ativas)</span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="label-xs text-info">Despesas Fixas</span>
            <Repeat size={14} className="text-info" />
          </div>
          <div>
            <div className="text-base font-bold text-ink">{formatCurrency(fixedReport.fixedExpensesTotal)}</div>
            <span className="text-xs text-ink-muted">{fixedReport.fixedPercentage.toFixed(0)}% dos gastos</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-surface border border-active rounded-2xl">
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
                ? 'bg-panel text-ink shadow-sm border border-active' 
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>{label}</span>
            {count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] bg-active text-ink">
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
            <div className="card p-8 text-center text-ink-muted">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-positive/50" />
              <p className="text-sm font-semibold text-ink">Nenhuma conta cadastrada</p>
              <p className="text-xs mt-1">Cadastre seus boletos e pagamentos periódicos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bills.map(bill => {
                const isPaid = bill.status === 'paid';
                const isOverdue = bill.status === 'overdue' || (bill.status === 'pending' && bill.dueDate < today);

                return (
                  <div 
                    key={bill.id}
                    className={`card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isPaid ? 'opacity-60 bg-surface-raised' : 'hover:border-edge-strong'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isPaid ? 'bg-positive/15 text-positive' : isOverdue ? 'bg-negative-strong/15 text-negative-strong' : 'bg-field text-ink-muted'
                      }`}>
                        {isPaid ? <Check size={18} /> : <Calendar size={18} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-semibold truncate ${isPaid ? 'line-through text-ink-muted' : 'text-ink'}`}>
                            {bill.description}
                          </h4>
                          {bill.isFixedExpense && (
                            <span className="pill pill-neutral text-[10px] py-0 px-1.5">Fixo</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 text-xs text-ink-muted">
                          <span>Vencimento: {formatDateBR(bill.dueDate)} ({formatRelativeDate(bill.dueDate)})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-edge">
                      <span className={`text-sm font-bold ${isPaid ? 'text-ink-muted' : 'text-ink'}`}>
                        {formatCurrency(bill.amount)}
                      </span>

                      <div className="flex items-center space-x-2">
                        {!isPaid ? (
                          <button
                            onClick={() => handlePayBill(bill)}
                            disabled={processingId === bill.id}
                            className="py-1.5 px-3 rounded-xl bg-positive/15 hover:bg-positive/25 text-positive text-xs font-semibold flex items-center space-x-1 transition-all min-h-[36px]"
                          >
                            <Check size={13} />
                            <span>Pagar</span>
                          </button>
                        ) : (
                          <span className="pill pill-positive text-[11px]">Pago</span>
                        )}

                        <button
                          onClick={() => { setBillToEdit(bill); setIsBillModalOpen(true); }}
                          className="btn btn-icon text-ink-muted hover:text-ink"
                          aria-label={`Editar conta ${bill.description}`}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => setPendingDelete({ kind: 'bill', id: bill.id, label: bill.description })}
                          className="btn btn-icon text-ink-muted hover:text-negative-strong"
                          aria-label={`Excluir conta ${bill.description}`}
                        >
                          <Trash2 size={14} />
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
            <div className="card p-8 text-center text-ink-muted">
              <ArrowUpRight size={36} className="mx-auto mb-2 text-positive/50" />
              <p className="text-sm font-semibold text-ink">Nenhum recebimento previsto</p>
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
                      isReceived ? 'opacity-60 bg-surface-raised' : 'hover:border-edge-strong'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isReceived ? 'bg-positive/15 text-positive' : 'bg-field text-positive'
                      }`}>
                        <ArrowUpRight size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-semibold truncate ${isReceived ? 'line-through text-ink-muted' : 'text-ink'}`}>
                          {rec.description}
                        </h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Previsto: {formatDateBR(rec.expectedDate)} ({formatRelativeDate(rec.expectedDate)})
                          {rec.origin && ` • ${rec.origin}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-edge">
                      <span className="text-sm font-bold text-positive">
                        +{formatCurrency(rec.amount)}
                      </span>

                      <div className="flex items-center space-x-2">
                        {!isReceived ? (
                          <button
                            onClick={() => handleReceive(rec)}
                            disabled={processingId === rec.id}
                            className="py-1.5 px-3 rounded-xl bg-positive text-surface text-xs font-bold flex items-center space-x-1 shadow-sm transition-all min-h-[36px]"
                          >
                            <Check size={13} />
                            <span>Receber</span>
                          </button>
                        ) : (
                          <span className="pill pill-positive text-[11px]">Recebido</span>
                        )}

                        <button
                          onClick={() => { setReceivableToEdit(rec); setIsRecModalOpen(true); }}
                          className="btn btn-icon text-ink-muted hover:text-ink"
                          aria-label={`Editar recebimento ${rec.description}`}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => setPendingDelete({ kind: 'receivable', id: rec.id, label: rec.description })}
                          className="btn btn-icon text-ink-muted hover:text-negative-strong"
                          aria-label={`Excluir recebimento ${rec.description}`}
                        >
                          <Trash2 size={14} />
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
          <div className="card p-4 flex items-center justify-between border-accent/20 bg-accent/5">
            <div className="flex items-center space-x-3">
              <Tv size={20} className="text-accent" />
              <div>
                <h4 className="text-xs font-bold text-ink">Impacto Anual das Assinaturas</h4>
                <p className="text-xs text-ink-muted">Economizar cancelando serviços ociosos</p>
              </div>
            </div>
            <span className="text-sm font-bold text-ink">{formatCurrency(subSummary.totalAnnualEstimate)}/ano</span>
          </div>

          <div className="space-y-2">
            {subscriptions.map(sub => (
              <div key={sub.id} className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Tv size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-ink truncate">{sub.name}</h4>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Próxima cobrança: {formatDateBR(sub.nextBillingDate)} • {formatCurrency(sub.annualEstimate)}/ano
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-edge">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-bold text-ink block">{formatCurrency(sub.amount)}</span>
                    <span className="text-[11px] text-ink-muted font-medium">{sub.frequency}</span>
                  </div>

                  <button
                    onClick={() => setPendingDelete({ kind: 'subscription', id: sub.id, label: sub.name })}
                    className="btn btn-icon text-ink-muted hover:text-negative-strong"
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
                  rule.type === 'income' ? 'bg-positive/15 text-positive' : 'bg-negative-strong/15 text-negative-strong'
                }`}>
                  <Repeat size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-ink truncate">{rule.description}</h4>
                    <span className="pill pill-neutral text-[10px] py-0 px-1.5">{rule.frequency}</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Próxima ocorrência: {formatDateBR(rule.nextOccurrence)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-edge">
                <span className={`text-sm font-bold ${rule.type === 'income' ? 'text-positive' : 'text-ink'}`}>
                  {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => skipRecurringOccurrence(rule.id)}
                    className="py-1 px-2.5 rounded-lg bg-field hover:bg-active text-ink-muted text-xs font-semibold min-h-[32px]"
                  >
                    Pular
                  </button>

                  <button
                    onClick={() => { setRecurringToEdit(rule); setIsRecurringModalOpen(true); }}
                    className="btn btn-icon text-ink-muted hover:text-ink"
                    aria-label={`Editar regra ${rule.description}`}
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => setPendingDelete({ kind: 'recurring', id: rule.id, label: rule.description })}
                    className="btn btn-icon text-ink-muted hover:text-negative-strong"
                    aria-label={`Excluir regra ${rule.description}`}
                  >
                    <Trash2 size={14} />
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

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar exclusão?"
        description={
          pendingDelete
            ? `"${pendingDelete.label}" será removido permanentemente. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel={isDeleting ? 'Excluindo…' : 'Sim, excluir'}
        tone="danger"
      />
    </div>
  );
};
