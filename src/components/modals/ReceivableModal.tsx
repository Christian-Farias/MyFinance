import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Receivable } from '../../types';

interface ReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivableToEdit?: Receivable;
}

export const ReceivableModal: React.FC<ReceivableModalProps> = ({ isOpen, onClose, receivableToEdit }) => {
  const { addReceivable, updateReceivable, categories, accounts } = useFinance();

  const [description, setDescription] = useState(receivableToEdit?.description || '');
  const [amountStr, setAmountStr] = useState(receivableToEdit ? receivableToEdit.amount.toString() : '');
  const [expectedDate, setExpectedDate] = useState(receivableToEdit?.expectedDate || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(receivableToEdit?.categoryId || (categories.find(c => c.type === 'income')?.id || 'trabalho'));
  const [accountId, setAccountId] = useState(receivableToEdit?.accountId || (accounts[0]?.id || ''));
  const [origin, setOrigin] = useState(receivableToEdit?.origin || '');
  const [isRecurringIncome, setIsRecurringIncome] = useState(receivableToEdit?.isRecurringIncome || false);
  const [notes, setNotes] = useState(receivableToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Informe a descrição do recebimento.');
      return;
    }
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    if (amount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (receivableToEdit) {
        await updateReceivable({
          ...receivableToEdit,
          description: description.trim(),
          amount,
          expectedDate,
          categoryId,
          accountId: accountId || undefined,
          origin: origin.trim() || undefined,
          isRecurringIncome,
          notes: notes.trim() || undefined,
        });
      } else {
        await addReceivable({
          description: description.trim(),
          amount,
          expectedDate,
          categoryId,
          accountId: accountId || undefined,
          status: 'expected',
          origin: origin.trim() || undefined,
          isRecurringIncome,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar conta a receber.');
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
            {receivableToEdit ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
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
              placeholder="Ex: Salário, Freelance, Reembolso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#39D98A] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Valor Previsto (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1000,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-medium placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Data Prevista</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Receber na Conta</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Origem / Pagador</label>
              <input
                type="text"
                placeholder="Ex: Empresa, Cliente"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center space-x-2 text-xs text-[#8E95A3] cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurringIncome}
                onChange={(e) => setIsRecurringIncome(e.target.checked)}
                className="w-4 h-4 accent-[#39D98A] rounded"
              />
              <span className="text-white">Renda Recorrente (mensal/fixa)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Parcela do projeto, nota fiscal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#39D98A] hover:bg-[#32c57c] text-[#0D0F12] font-bold text-xs sm:text-sm shadow-lg shadow-[#39D98A]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : (receivableToEdit ? 'Atualizar Recebimento' : 'Salvar Recebimento')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
