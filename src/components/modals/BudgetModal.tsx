import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Budget } from '../../types';
import { AmountField, Modal, SelectField } from '../ui';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
}) => {
  const { addBudget, updateBudget, categories, selectedPeriod } = useFinance();

  const [categoryId, setCategoryId] = useState(budgetToEdit?.categoryId || (categories[0]?.id || 'alimentacao'));
  const [limitStr, setLimitStr] = useState(budgetToEdit ? budgetToEdit.limitAmount.toString() : '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          limitAmount: limit,
        });
      } else {
        await addBudget({
          categoryId,
          monthYear: selectedPeriod,
          limitAmount: limit,
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
    <Modal
      open={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Editar Orçamento' : 'Novo Orçamento de Categoria'}
      size="md"
      footer={
        <button
          type="submit"
          form="budget-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (budgetToEdit ? 'Salvar Alterações' : 'Criar Orçamento')}</span>
        </button>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Categoria"
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />

        <AmountField
          label="Limite Máximo Mensal"
          value={limitStr}
          onChange={setLimitStr}
          placeholder="700,00"
          error={errorMsg || undefined}
          autoFocus
        />
      </form>
    </Modal>
  );
};