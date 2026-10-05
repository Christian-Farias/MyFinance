import React, { useState } from 'react';
import { Plus, CreditCard as CardIcon, Layers, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { VisualCreditCard } from '../components/VisualCreditCard';
import { TransactionItem } from '../components/TransactionItem';
import { CardModal } from '../components/modals/CardModal';
import { formatCurrency, formatDateBR } from '../calculations/financialCalculations';
import type { CreditCard } from '../types';
import { ErrorState, LoadingState } from '../components/ui';

export const CardsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { cards, transactions, categories, openNewTxModal, openTxDetail, deleteCard } = useFinance();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | undefined>(undefined);
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');

  const activeCard = cards.find(c => c.id === selectedCardId) || cards[0];
  const cardTransactions = transactions.filter(t => t.cardId === activeCard?.id);
  const recentPurchases = cardTransactions.slice(0, 6);
  const installmentTxs = cardTransactions.filter(t => t.installmentTotal && t.installmentTotal > 1);

  const invoiceAmount = activeCard ? Math.max(0, activeCard.limit - activeCard.availableLimit) : 0;
  const usedPercent  = activeCard && activeCard.limit > 0 ? Math.min(100, (invoiceAmount / activeCard.limit) * 100) : 0;

  const barColor = usedPercent >= 90 ? 'var(--color-negative)' : usedPercent >= 70 ? 'var(--color-warning)' : 'var(--color-positive)';

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
        <h1 className="text-2xl font-bold text-ink tracking-tight">Cartões</h1>
        <button
          onClick={() => { setCardToEdit(undefined); setIsCardModalOpen(true); }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Novo</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CardIcon size={28} className="text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-2">Nenhum cartão cadastrado</h3>
          <p className="label-xs leading-relaxed mb-5">Adicione seu cartão para acompanhar limites e faturas.</p>
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="btn btn-primary"
          >
            Adicionar cartão
          </button>
        </div>
      ) : (
        <>
          {/* ── CARD SELECTOR PILLS ── */}
          {cards.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
              {cards.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    activeCard?.id === c.id
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-surface text-ink-muted border border-edge hover:text-ink'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* ── VISUAL CARD ── */}
          {activeCard && (
            <VisualCreditCard
              card={activeCard}
              currentInvoice={invoiceAmount}
              onNewExpense={() => openNewTxModal('expense')}
            />
          )}

          {/* ── INVOICE STATS ── */}
          {activeCard && (
            <div className="card p-5">
              <p className="label-section mb-4">Uso do limite</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="label-xs mb-1">Fatura atual</p>
                  <p className="text-sm font-bold text-negative">{formatCurrency(invoiceAmount)}</p>
                </div>
                <div>
                  <p className="label-xs mb-1">Disponível</p>
                  <p className="text-sm font-bold text-positive">{formatCurrency(activeCard.availableLimit)}</p>
                </div>
                <div>
                  <p className="label-xs mb-1">Limite total</p>
                  <p className="text-sm font-bold text-ink">{formatCurrency(activeCard.limit)}</p>
                </div>
              </div>
              <div className="progress-track-thick">
                <div className="progress-fill" style={{ width: `${usedPercent}%`, backgroundColor: barColor }} />
              </div>
              <p className="label-xs mt-2">{usedPercent.toFixed(0)}% do limite utilizado</p>

              {/* Edit / Delete */}
              <div className="flex items-center space-x-2 pt-3 mt-3 border-t border-edge">
                <button
                  onClick={() => { setCardToEdit(activeCard); setIsCardModalOpen(true); }}
                  className="flex items-center space-x-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
                <span className="text-edge">•</span>
                <button
                  onClick={() => deleteCard(activeCard.id)}
                  className="flex items-center space-x-1.5 text-xs text-negative/60 hover:text-negative transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Excluir</span>
                </button>
                {activeCard.dueDay && (
                  <>
                    <span className="text-edge">•</span>
                    <span className="label-xs">Vence dia {activeCard.dueDay}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── RECENT PURCHASES ── */}
          <div>
            <p className="label-section mb-3 px-0.5">Últimas compras</p>
            {recentPurchases.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-xs text-ink-faint">Nenhuma compra registrada neste cartão.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                {recentPurchases.map((tx, idx) => {
                  const category = categories.find(c => c.id === tx.categoryId);
                  return (
                    <div key={tx.id} className={idx < recentPurchases.length - 1 ? 'border-b border-edge' : ''}>
                      <TransactionItem
                        transaction={tx}
                        category={category}
                        card={activeCard}
                        showDate
                        onClick={() => openTxDetail(tx)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── INSTALLMENTS ── */}
          {installmentTxs.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3 px-0.5">
                <Layers size={13} className="text-accent" />
                <p className="label-section">Parcelamentos em andamento</p>
              </div>
              <div className="card overflow-hidden">
                {installmentTxs.map((tx, idx) => (
                  <button
                    key={tx.id}
                    onClick={() => openTxDetail(tx)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-raised transition-colors ${
                      idx < installmentTxs.length - 1 ? 'border-b border-edge' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink">{tx.description}</p>
                      <p className="label-xs mt-0.5">
                        Parcela {tx.installmentNumber} de {tx.installmentTotal} • {formatDateBR(tx.date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-ink">{formatCurrency(tx.amount)}</span>
                      <ChevronRight size={13} className="text-ink-faint" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        cardToEdit={cardToEdit}
      />
    </div>
  );
};
