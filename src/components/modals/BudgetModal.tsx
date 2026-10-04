import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Budget } from '../../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit
}) => {
  const { addBudget, updateBudget, categories, selectedPeriod } = useFinance();

  const [categoryId, setCategoryId] = useState(budgetToEdit?.categoryId || (categories[0]?.id || 'alimentacao'));
  const [limitStr, setLimitStr] = useState(budgetToEdit ? budgetToEdit.limitAmount.toString() : '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitStr.replace(',', '.')) || 0;
    if (limit <= 0) {
      setErrorMsg('Informe um limite válido maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (budgetToEdit) {
        await updateBudget({
          ...budgetToEdit,
          categoryId,
          limitAmount: limit
        });
      } else {
        await addBudget({
          categoryId,
          monthYear: selectedPeriod,
          limitAmount: limit
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar orçamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-[#14171D] border border-[#222733] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {budgetToEdit ? 'Editar Orçamento' : 'Novo Orçamento de Categoria'}
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
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-[#1A1F29] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Limite Máximo Mensal (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8E95A3]">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="700,00"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-xl font-bold text-white placeholder-[#5F6570]"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-semibold text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : (budgetToEdit ? 'Salvar Alterações' : 'Criar Orçamento')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
