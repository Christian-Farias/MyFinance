import React, { useState } from 'react';
import { X, Sparkles, Trash2, Calendar, CreditCard, Wallet, Tag, Layers, AlertCircle, Edit2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';
import { CategoryIcon } from '../CategoryIcon';

export const TransactionDetailModal: React.FC = () => {
  const { 
    selectedTxForDetail, 
    closeTxDetail, 
    deleteTransaction,
    openNewTxModal,
    categories, 
    accounts, 
    cards 
  } = useFinance();

  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!selectedTxForDetail) return null;

  const tx = selectedTxForDetail;
  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const category = categories.find(c => c.id === tx.categoryId);
  const account = accounts.find(a => a.id === tx.accountId);
  const card = cards.find(c => c.id === tx.cardId);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTransaction(tx.id);
      closeTxDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    closeTxDetail();
    openNewTxModal(tx.type, tx);
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-panel w-full sm:max-w-md px-5 sm:px-6 pt-5 sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#222733]">
          <h3 className="text-xs sm:text-sm font-semibold text-[#8E95A3]">Detalhe da transação</h3>
          <button
            onClick={closeTxDetail}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Amount & Desc */}
        <div className="flex items-center space-x-4 my-5 sm:my-6">
          <CategoryIcon
            iconName={category?.icon || (isIncome ? 'wallet' : 'tag')}
            color={category?.color || (isIncome ? '#39D98A' : '#8E95A3')}
            size={22}
            className="w-12 h-12 sm:w-14 sm:h-14"
          />
          <div className="min-w-0 flex-1">
            <div 
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isIncome 
                  ? 'text-[#39D98A]' 
                  : isTransfer 
                  ? 'text-[#3B82F6]' 
                  : 'text-white'
              }`}
            >
              {isIncome ? '+ ' : isTransfer ? '' : '- '}
              {formatCurrency(tx.amount)}
            </div>
            <h4 className="text-white font-medium text-sm sm:text-base leading-tight mt-0.5 truncate">{tx.description}</h4>
            <span className="text-[#8E95A3] text-xs font-mono">{formatDateBR(tx.date)}</span>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-2.5 mb-5 sm:mb-6">
          {/* Categoria */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1A1F29] border border-[#262C3A]">
            <div className="flex items-center space-x-3">
              <Tag size={16} className="text-[#8E95A3]" />
              <span className="text-xs text-[#8E95A3]">Categoria</span>
            </div>
            <span className="text-xs font-semibold text-white">{category?.name || 'Outros'}</span>
          </div>

          {/* Conta / Cartão */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1A1F29] border border-[#262C3A]">
            <div className="flex items-center space-x-3">
              {card ? <CreditCard size={16} className="text-[#8B7CFF]" /> : <Wallet size={16} className="text-[#8E95A3]" />}
              <span className="text-xs text-[#8E95A3]">{card ? 'Cartão' : 'Conta'}</span>
            </div>
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
              {card ? `${card.name} (•••• ${card.lastDigits || '0000'})` : (account?.name || 'Conta principal')}
            </span>
          </div>

          {/* Parcela info if any */}
          {Boolean(tx.installmentNumber && tx.installmentTotal) && (
            <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1A1F29] border border-[#262C3A]">
              <div className="flex items-center space-x-3">
                <Layers size={16} className="text-[#8B7CFF]" />
                <span className="text-xs text-[#8E95A3]">Parcela</span>
              </div>
              <span className="text-xs font-semibold text-white">
                {tx.installmentNumber} de {tx.installmentTotal}
              </span>
            </div>
          )}

          {/* Data */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#1A1F29] border border-[#262C3A]">
            <div className="flex items-center space-x-3">
              <Calendar size={16} className="text-[#8E95A3]" />
              <span className="text-xs text-[#8E95A3]">Data da operação</span>
            </div>
            <span className="text-xs font-semibold text-white">{formatDateBR(tx.date)}</span>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="p-4 rounded-2xl bg-[#1E232D] border border-[#262C3A] mb-5 sm:mb-6">
          <div className="flex items-center space-x-2 text-[#8B7CFF] text-xs font-semibold mb-1.5">
            <Sparkles size={15} />
            <span>Análise da IA</span>
          </div>
          <p className="text-xs text-[#8E95A3] leading-relaxed">
            {tx.notes || (
              tx.installmentTotal 
                ? `Esta compra faz parte de uma compra parcelada de ${formatCurrency(tx.amount * tx.installmentTotal)} (${tx.installmentTotal}x).`
                : isIncome 
                ? `Receita contabilizada no saldo de ${account?.name || 'suas contas'}.`
                : `Despesa registrada em ${category?.name || 'Outros'}.`
            )}
          </p>
        </div>

        {/* Delete Confirmation prompt */}
        {confirmDelete ? (
          <div className="p-4 rounded-2xl bg-[#2A1215] border border-[#FF5555]/30 space-y-3">
            <div className="flex items-center space-x-2 text-[#FF5555] text-xs font-semibold">
              <AlertCircle size={16} />
              <span>Confirmar exclusão?</span>
            </div>
            <p className="text-xs text-[#8E95A3]">
              Ao excluir, o saldo da conta e os limites de cartões e orçamentos serão recalculados imediatamente.
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FF5555] text-white text-xs font-semibold hover:bg-[#e04848] transition-colors"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="py-2 px-4 rounded-xl bg-[#1A1F29] text-[#8E95A3] text-xs font-semibold hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleEdit}
              className="flex-1 py-3 px-4 rounded-xl bg-[#1A1F29] hover:bg-[#262C3A] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-[#262C3A]"
            >
              <Edit2 size={14} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="py-3 px-4 rounded-xl bg-[#2A1215] hover:bg-[#35161A] text-[#FF5555] border border-[#FF5555]/20 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 size={15} />
              <span>Excluir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
