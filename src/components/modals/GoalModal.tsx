import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Goal } from '../../types';
import { AmountField, ColorSwatchRow, Modal, TextField } from '../ui';

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
  const [color, setColor] = useState(goalToEdit?.color || 'var(--color-accent)');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const goalColors = ['var(--color-accent)', 'var(--color-positive)', 'var(--color-info)', '#FFB74D', '#EC4899', '#8A05BE'];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Editar Meta' : 'Nova Meta Financeira'}
      size="md"
      footer={
        <button
          type="submit"
          form="goal-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (goalToEdit ? 'Atualizar Meta' : 'Criar Meta')}</span>
        </button>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome da Meta"
          placeholder="Ex: Comprar PC, Viagem Europa, Reserva..."
          value={name}
          onChange={setName}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <AmountField label="Valor Objetivo" value={targetAmountStr} onChange={setTargetAmountStr} placeholder="5000,00" />
          <AmountField label="Valor Já Guardado" value={currentAmountStr} onChange={setCurrentAmountStr} placeholder="0,00" />
        </div>

        <TextField
          label="Prazo Estimado (Opcional)"
          type="date"
          value={deadline}
          onChange={setDeadline}
        />

        <ColorSwatchRow label="Cor da Meta" colors={goalColors} value={color} onChange={setColor} />

        {errorMsg && (
          <p role="alert" className="text-xs text-negative-strong">
            {errorMsg}
          </p>
        )}
      </form>
    </Modal>
  );
};
