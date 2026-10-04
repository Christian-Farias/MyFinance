import React, { useState } from 'react';
import { X, Calendar, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Bill } from '../../types';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: Bill;
}

export const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, billToEdit }) => {
  const { addBill, updateBill, categories, accounts, cards } = useFinance();

  const [description, setDescription] = useState(billToEdit?.description || '');
  const [amountStr, setAmountStr] = useState(billToEdit ? billToEdit.amount.toString() : '');
  const [dueDate, setDueDate] = useState(billToEdit?.dueDate || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(billToEdit?.categoryId || (categories[0]?.id || 'outros'));
  const [accountId, setAccountId] = useState(billToEdit?.accountId || (accounts[0]?.id || ''));
  const [cardId, setCardId] = useState(billToEdit?.cardId || '');
  const [isFixedExpense, setIsFixedExpense] = useState(billToEdit?.isFixedExpense || false);
  const [isSubscription, setIsSubscription] = useState(billToEdit?.isSubscription || false);
  const [notes, setNotes] = useState(billToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Informe a descrição da conta.');
      return;
    }
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    if (amount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (billToEdit) {
        await updateBill({
          ...billToEdit,
          description: description.trim(),
          amount,
          dueDate,
          categoryId,
          accountId: accountId || undefined,
          cardId: cardId || undefined,
          isFixedExpense,
          isSubscription,
          notes: notes.trim() || undefined,
        });
      } else {
        await addBill({
          description: description.trim(),
          amount,
          dueDate,
          categoryId,
          accountId: accountId || undefined,
          cardId: cardId || undefined,
          status: 'pending',
          isFixedExpense,
          isSubscription,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-[#14171D] border border-[#222733] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {billToEdit ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Aluguel, Internet, Luz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="100,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-medium placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-xs text-white"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-[#1A1F29] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <label className="flex items-center space-x-2 text-xs text-[#8E95A3] cursor-pointer">
              <input
                type="checkbox"
                checked={isFixedExpense}
                onChange={(e) => setIsFixedExpense(e.target.checked)}
                className="w-4 h-4 accent-[#8B7CFF] rounded"
              />
              <span className="text-white">Despesa Fixa</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-[#8E95A3] cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="w-4 h-4 accent-[#8B7CFF] rounded"
              />
              <span className="text-white">Assinatura</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Código de barras, boleto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : (billToEdit ? 'Atualizar Conta' : 'Salvar Conta')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
