import React, { useState } from 'react';
import { X, Target, Calendar, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Goal } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit
}) => {
  const { addGoal, updateGoal } = useFinance();

  const [name, setName] = useState(goalToEdit?.name || '');
  const [targetAmountStr, setTargetAmountStr] = useState(goalToEdit ? goalToEdit.targetAmount.toString() : '');
  const [currentAmountStr, setCurrentAmountStr] = useState(goalToEdit ? goalToEdit.currentAmount.toString() : '0');
  const [deadline, setDeadline] = useState(goalToEdit?.deadline || '');
  const [color, setColor] = useState(goalToEdit?.color || '#8B7CFF');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome da meta.');
      return;
    }
    const target = parseFloat(targetAmountStr.replace(',', '.')) || 0;
    const current = parseFloat(currentAmountStr.replace(',', '.')) || 0;
    if (target <= 0) {
      setErrorMsg('Informe um valor de meta maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (goalToEdit) {
        await updateGoal({
          ...goalToEdit,
          name: name.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: deadline || undefined,
          color
        });
      } else {
        await addGoal({
          name: name.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: deadline || undefined,
          color,
          icon: 'Target'
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goalColors = ['#8B7CFF', '#39D98A', '#3B82F6', '#FFB74D', '#EC4899', '#8A05BE'];

  return (
    <div className="modal-overlay">
      <div 
        className="modal-panel w-full sm:max-w-md px-5 sm:px-6 pt-5 sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {goalToEdit ? 'Editar Meta' : 'Nova Meta Financeira'}
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
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Nome da Meta</label>
            <input
              type="text"
              placeholder="Ex: Comprar PC, Viagem Europa, Reserva..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Valor Objetivo (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="5000,00"
                value={targetAmountStr}
                onChange={(e) => setTargetAmountStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-medium placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Valor Já Guardado (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={currentAmountStr}
                onChange={(e) => setCurrentAmountStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-medium placeholder-[#5F6570]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Prazo Estimado (Opcional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1.5">Cor da Meta</label>
            <div className="flex items-center space-x-2">
              {goalColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : (goalToEdit ? 'Atualizar Meta' : 'Criar Meta')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
