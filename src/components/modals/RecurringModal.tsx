import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { RecurringTransaction, RecurrenceFrequency } from '../../types';
import { AmountField, CheckboxField, Modal, SegmentedControl, SelectField, TextAreaField, TextField } from '../ui';

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
    <Modal
      open={isOpen}
      onClose={onClose}
      title={recurringToEdit ? 'Editar Recorrência' : 'Nova Regra Recorrente'}
      size="md"
      footer={
        <button
          type="submit"
          form="recurring-form"
          disabled={isSubmitting}
          className={`btn btn-block ${type === 'expense' ? 'btn-primary' : 'btn-positive'}`}
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (recurringToEdit ? 'Atualizar Recorrência' : 'Salvar Recorrência')}</span>
        </button>
      }
    >
      <form id="recurring-form" onSubmit={handleSubmit} className="space-y-4">
        <SegmentedControl
          label="Tipo de recorrência"
          value={type}
          onChange={(v) => {
            const next = v === 'expense';
            setType(next ? 'expense' : 'income');
            if (next) setIsFixedExpense(true);
            else setIsRecurringIncome(true);
          }}
          options={[
            { value: 'expense', label: 'Despesa Recorrente' },
            { value: 'income', label: 'Receita Recorrente' },
          ]}
        />

        <TextField
          label="Descrição"
          placeholder="Ex: Salário, Aluguel, Internet, Academia..."
          value={description}
          onChange={setDescription}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <AmountField label="Valor" value={amountStr} onChange={setAmountStr} placeholder="100,00" />
          <SelectField
            label="Frequência"
            value={frequency}
            onChange={(v) => setFrequency(v as RecurrenceFrequency)}
            options={[
              { value: 'weekly', label: 'Semanal' },
              { value: 'biweekly', label: 'Quinzenal' },
              { value: 'monthly', label: 'Mensal' },
              { value: 'bimonthly', label: 'Bimestral' },
              { value: 'quarterly', label: 'Trimestral' },
              { value: 'semiannual', label: 'Semestral' },
              { value: 'annual', label: 'Anual' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField label="Data Inicial" type="date" value={startDate} onChange={setStartDate} />
          <TextField label="Data Final (Opcional)" type="date" value={endDate} onChange={setEndDate} />
        </div>

        <SelectField
          label="Categoria"
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Conta"
            value={accountId}
            onChange={setAccountId}
            options={[
              { value: '', label: 'Sem conta vinculada' },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <SelectField
            label="Cartão"
            value={cardId}
            onChange={setCardId}
            options={[
              { value: '', label: 'Sem cartão vinculado' },
              ...cards.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        {type === 'expense' ? (
          <fieldset className="flex items-center gap-5">
            <legend className="sr-only">Classificação da despesa</legend>
            <CheckboxField
              label="Despesa Fixa"
              checked={isFixedExpense}
              onChange={setIsFixedExpense}
            />
            <CheckboxField
              label="Assinatura (Streaming/SaaS)"
              checked={isSubscription}
              onChange={setIsSubscription}
            />
          </fieldset>
        ) : (
          <CheckboxField
            label="Renda Recorrente"
            checked={isRecurringIncome}
            onChange={setIsRecurringIncome}
          />
        )}

        <TextAreaField
          label="Observações (opcional)"
          placeholder="Ex: Contrato de 12 meses..."
          value={notes}
          onChange={setNotes}
          rows={2}
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
