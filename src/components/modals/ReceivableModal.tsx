import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Receivable } from '../../types';
import { AmountField, CheckboxField, Modal, SelectField, TextField } from '../ui';

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
    <Modal
      open={isOpen}
      onClose={onClose}
      title={receivableToEdit ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
      size="md"
      footer={
        <button
          type="submit"
          form="receivable-form"
          disabled={isSubmitting}
          className="btn btn-positive btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (receivableToEdit ? 'Atualizar Recebimento' : 'Salvar Recebimento')}</span>
        </button>
      }
    >
      <form id="receivable-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Descrição"
          placeholder="Ex: Salário, Freelance, Reembolso..."
          value={description}
          onChange={setDescription}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <AmountField label="Valor Previsto" value={amountStr} onChange={setAmountStr} placeholder="1000,00" />
          <TextField label="Data Prevista" type="date" value={expectedDate} onChange={setExpectedDate} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Receber na Conta"
            value={accountId}
            onChange={setAccountId}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
          <TextField
            label="Origem / Pagador"
            placeholder="Ex: Empresa, Cliente"
            value={origin}
            onChange={setOrigin}
          />
        </div>

        <CheckboxField
          label="Renda Recorrente (mensal/fixa)"
          checked={isRecurringIncome}
          onChange={setIsRecurringIncome}
        />

        <TextField
          label="Observações (opcional)"
          placeholder="Ex: Parcela do projeto, nota fiscal..."
          value={notes}
          onChange={setNotes}
        />

        {errorMsg && (
          <p role="alert" className="text-xs text-negative-strong">
            {errorMsg}
          </p>
        )}
      </form>
    </Modal>
  );
};
