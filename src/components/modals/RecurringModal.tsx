import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { RecurringTransaction, RecurrenceFrequency } from '../../types';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringToEdit?: RecurringTransaction;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({ isOpen, onClose, recurringToEdit }) => {
  const { addRecurring, updateRecurring, categories, accounts, cards } = useFinance();

  const [description, setDescription] = useState(recurringToEdit?.description || '');
  const [amountStr, setAmountStr] = useState(recurringToEdit ? recurringToEdit.amount.toString() : '');
  const [type, setType] = useState<'expense' | 'income'>(recurringToEdit?.type || 'expense');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(recurringToEdit?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(recurringToEdit?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(recurringToEdit?.endDate || '');
  const [categoryId, setCategoryId] = useState(recurringToEdit?.categoryId || (categories[0]?.id || 'outros'));
  const [accountId, setAccountId] = useState(recurringToEdit?.accountId || (accounts[0]?.id || ''));
  const [cardId, setCardId] = useState(recurringToEdit?.cardId || '');
  const [isSubscription, setIsSubscription] = useState(recurringToEdit?.isSubscription || false);
  const [isFixedExpense, setIsFixedExpense] = useState<boolean>(recurringToEdit?.isFixedExpense ?? true);
  const [isRecurringIncome, setIsRecurringIncome] = useState(recurringToEdit?.isRecurringIncome || false);
  const [notes, setNotes] = useState(recurringToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Informe a descrição da recorrência.');
      return;
    }
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    if (amount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (recurringToEdit) {
        await updateRecurring({
          ...recurringToEdit,
          description: description.trim(),
          amount,
          type,
          frequency,
          startDate,
          nextOccurrence: recurringToEdit.nextOccurrence || startDate,
          endDate: endDate || undefined,
          categoryId,
          accountId: accountId || undefined,
          cardId: cardId || undefined,
          isSubscription,
          isFixedExpense: type === 'expense' ? isFixedExpense : false,
          isRecurringIncome: type === 'income' ? isRecurringIncome : false,
          notes: notes.trim() || undefined,
        });
      } else {
        await addRecurring({
          description: description.trim(),
          amount,
          type,
          frequency,
          startDate,
          nextOccurrence: startDate,
          endDate: endDate || undefined,
          categoryId,
          accountId: accountId || undefined,
          cardId: cardId || undefined,
          status: 'active',
          isSubscription,
          isFixedExpense: type === 'expense' ? isFixedExpense : false,
          isRecurringIncome: type === 'income' ? isRecurringIncome : false,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar recorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-panel w-full sm:max-w-md px-5 sm:px-6 pt-5 sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {recurringToEdit ? 'Editar Recorrência' : 'Nova Regra Recorrente'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-[#0D0F12] rounded-2xl border border-[#222733]">
          <button
            type="button"
            onClick={() => { setType('expense'); setIsFixedExpense(true); }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              type === 'expense' ? 'bg-[#FF5555] text-white' : 'text-[#8E95A3]'
            }`}
          >
            Despesa Recorrente
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setIsRecurringIncome(true); }}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              type === 'income' ? 'bg-[#39D98A] text-[#0D0F12] font-bold' : 'text-[#8E95A3]'
            }`}
          >
            Receita Recorrente
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Salário, Aluguel, Internet, Academia..."
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
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Frequência</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              >
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
                <option value="bimonthly">Bimestral</option>
                <option value="quarterly">Trimestral</option>
                <option value="semiannual">Semestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Data Final (Opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-[#1A1F29] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {type === 'expense' && (
            <div className="flex items-center space-x-4 pt-1">
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
                <span className="text-white">Assinatura (Streaming/SaaS)</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Contrato de 12 meses..."
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
              <span>{isSubmitting ? 'Salvando...' : (recurringToEdit ? 'Atualizar Recorrência' : 'Salvar Recorrência')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
