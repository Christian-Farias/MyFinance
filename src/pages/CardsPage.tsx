import React, { useState } from 'react';
import { Plus, CreditCard as CardIcon, Layers, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { VisualCreditCard } from '../components/VisualCreditCard';
import { TransactionItem } from '../components/TransactionItem';
import { CardModal } from '../components/modals/CardModal';
import { formatCurrency, formatDateBR } from '../calculations/financialCalculations';
import type { CreditCard } from '../types';

export const CardsPage: React.FC = () => {
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

  const barColor = usedPercent >= 90 ? '#FF5C5C' : usedPercent >= 70 ? '#F59E0B' : '#39D98A';

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Cartões</h1>
        <button
          onClick={() => { setCardToEdit(undefined); setIsCardModalOpen(true); }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 text-[#8B7CFF] text-xs font-semibold hover:bg-[#8B7CFF]/15 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Novo</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            <CardIcon size={28} className="text-[#8B7CFF]" />
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">Nenhum cartão cadastrado</h3>
          <p className="label-xs leading-relaxed mb-5">Adicione seu cartão para acompanhar limites e faturas.</p>
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#8B7CFF] text-white text-xs font-semibold hover:bg-[#7B6CEF] transition-colors"
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
                      ? 'bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30'
                      : 'bg-[#0D0F12] text-[#8B919B] border border-[#1D2026] hover:text-[#F5F5F5]'
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
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="label-xs mb-1">Fatura atual</p>
                  <p className="text-sm font-bold text-[#FF5C5C]">{formatCurrency(invoiceAmount)}</p>
                </div>
                <div>
                  <p className="label-xs mb-1">Disponível</p>
                  <p className="text-sm font-bold text-[#39D98A]">{formatCurrency(activeCard.availableLimit)}</p>
                </div>
                <div>
                  <p className="label-xs mb-1">Limite total</p>
                  <p className="text-sm font-bold text-[#F5F5F5]">{formatCurrency(activeCard.limit)}</p>
                </div>
              </div>
              <div className="progress-track-thick">
                <div className="progress-fill" style={{ width: `${usedPercent}%`, backgroundColor: barColor }} />
              </div>
              <p className="label-xs mt-2">{usedPercent.toFixed(0)}% do limite utilizado</p>

              {/* Edit / Delete */}
              <div className="flex items-center space-x-2 pt-3 mt-3 border-t border-[#1D2026]">
                <button
                  onClick={() => { setCardToEdit(activeCard); setIsCardModalOpen(true); }}
                  className="flex items-center space-x-1.5 text-xs text-[#8B919B] hover:text-[#F5F5F5] transition-colors"
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
                <span className="text-[#1D2026]">•</span>
                <button
                  onClick={() => deleteCard(activeCard.id)}
                  className="flex items-center space-x-1.5 text-xs text-[#FF5C5C]/60 hover:text-[#FF5C5C] transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Excluir</span>
                </button>
                {activeCard.dueDay && (
                  <>
                    <span className="text-[#1D2026]">•</span>
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
                <p className="text-xs text-[#5F6570]">Nenhuma compra registrada neste cartão.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                {recentPurchases.map((tx, idx) => {
                  const category = categories.find(c => c.id === tx.categoryId);
                  return (
                    <div key={tx.id} className={idx < recentPurchases.length - 1 ? 'border-b border-[#1D2026]' : ''}>
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
                <Layers size={13} className="text-[#8B7CFF]" />
                <p className="label-section">Parcelamentos em andamento</p>
              </div>
              <div className="card overflow-hidden">
                {installmentTxs.map((tx, idx) => (
                  <button
                    key={tx.id}
                    onClick={() => openTxDetail(tx)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#121419] transition-colors ${
                      idx < installmentTxs.length - 1 ? 'border-b border-[#1D2026]' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#F5F5F5]">{tx.description}</p>
                      <p className="label-xs mt-0.5">
                        Parcela {tx.installmentNumber} de {tx.installmentTotal} • {formatDateBR(tx.date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#F5F5F5]">{formatCurrency(tx.amount)}</span>
                      <ChevronRight size={13} className="text-[#5F6570]" />
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
