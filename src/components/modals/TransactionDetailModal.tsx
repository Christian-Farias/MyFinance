import React, { useState } from 'react';
import { Sparkles, Trash2, Calendar, CreditCard, Wallet, Tag, Layers, Edit2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';
import { CategoryIcon } from '../CategoryIcon';
import { ConfirmDialog, Modal } from '../ui';

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
    openNewTxModal(tx.type, tx ?? undefined);
  };

  return (
    <>
      <Modal
        open
        onClose={closeTxDetail}
        title="Detalhe da transação"
        size="md"
        showCloseButton={false}
        footer={
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleEdit}
              className="btn btn-secondary flex-1"
            >
              <Edit2 size={14} aria-hidden="true" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn btn-danger"
            >
              <Trash2 size={15} aria-hidden="true" />
              <span>Excluir</span>
            </button>
          </div>
        }
      >
        <div className="flex items-center space-x-4">
          <CategoryIcon
            iconName={category?.icon || (isIncome ? 'wallet' : 'tag')}
            color={category?.color || (isIncome ? 'var(--color-positive)' : 'var(--color-ink-muted)')}
            size={22}
            className="w-12 h-12 sm:w-14 sm:h-14"
          />
          <div className="min-w-0 flex-1">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isIncome ? 'text-positive' : isTransfer ? 'text-info' : 'text-ink'
              }`}
            >
              {isIncome ? '+ ' : isTransfer ? '' : '- '}
              {formatCurrency(tx.amount)}
            </div>
            <h3 className="text-ink font-medium text-sm sm:text-base leading-tight mt-0.5 truncate">
              {tx.description}
            </h3>
            <span className="text-ink-muted text-xs font-mono">{formatDateBR(tx.date)}</span>
          </div>
        </div>

        <dl className="space-y-2.5 mt-5 sm:mt-6">
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-field border border-edge-strong">
            <dt className="flex items-center space-x-3">
              <Tag size={16} className="text-ink-muted" aria-hidden="true" />
              <span className="text-xs text-ink-muted">Categoria</span>
            </dt>
            <dd className="text-xs font-semibold text-ink">{category?.name || 'Outros'}</dd>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-field border border-edge-strong">
            <dt className="flex items-center space-x-3">
              {card ? (
                <CreditCard size={16} className="text-accent-text" aria-hidden="true" />
              ) : (
                <Wallet size={16} className="text-ink-muted" aria-hidden="true" />
              )}
              <span className="text-xs text-ink-muted">{card ? 'Cartão' : 'Conta'}</span>
            </dt>
            <dd className="text-xs font-semibold text-ink truncate max-w-[200px]">
              {card ? `${card.name} (•••• ${card.lastDigits || '0000'})` : account?.name || 'Conta principal'}
            </dd>
          </div>

          {Boolean(tx.installmentNumber && tx.installmentTotal) && (
            <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-field border border-edge-strong">
              <dt className="flex items-center space-x-3">
                <Layers size={16} className="text-accent-text" aria-hidden="true" />
                <span className="text-xs text-ink-muted">Parcela</span>
              </dt>
              <dd className="text-xs font-semibold text-ink">
                {tx.installmentNumber} de {tx.installmentTotal}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-field border border-edge-strong">
            <dt className="flex items-center space-x-3">
              <Calendar size={16} className="text-ink-muted" aria-hidden="true" />
              <span className="text-xs text-ink-muted">Data da operação</span>
            </dt>
            <dd className="text-xs font-semibold text-ink">{formatDateBR(tx.date)}</dd>
          </div>
        </dl>

        <div className="p-4 rounded-2xl bg-edge-strong border border-edge-strong mt-5 sm:mt-6">
          <div className="flex items-center space-x-2 text-accent-text text-xs font-semibold mb-1.5">
            <Sparkles size={15} aria-hidden="true" />
            <span>Análise da IA</span>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">
            {tx.notes ||
              (tx.installmentTotal
                ? `Esta compra faz parte de uma compra parcelada de ${formatCurrency(tx.amount * tx.installmentTotal)} (${tx.installmentTotal}x).`
                : isIncome
                  ? `Receita contabilizada no saldo de ${account?.name || 'suas contas'}.`
                  : `Despesa registrada em ${category?.name || 'Outros'}.`)}
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Excluir esta transação?"
        description="O saldo da conta e os limites de cartões e orçamentos serão recalculados imediatamente."
        confirmLabel={isDeleting ? 'Excluindo…' : 'Sim, excluir'}
        tone="danger"
      />
    </>
  );
};
