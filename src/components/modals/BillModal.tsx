import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Bill } from '../../types';
import { AmountField, CheckboxField, Modal, SelectField, TextField } from '../ui';

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
    <Modal
      open={isOpen}
      onClose={onClose}
      title={billToEdit ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
      size="md"
      footer={
        <button
          type="submit"
          form="bill-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (billToEdit ? 'Atualizar Conta' : 'Salvar Conta')}</span>
        </button>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Descrição"
          placeholder="Ex: Aluguel, Internet, Luz..."
          value={description}
          onChange={setDescription}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <AmountField label="Valor" value={amountStr} onChange={setAmountStr} placeholder="100,00" />
          <TextField label="Vencimento" type="date" value={dueDate} onChange={setDueDate} />
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

        <fieldset>
          <legend className="field-label">Classificação</legend>
          <div className="flex items-center gap-5">
            <CheckboxField
              label="Despesa Fixa"
              checked={isFixedExpense}
              onChange={setIsFixedExpense}
            />
            <CheckboxField
              label="Assinatura"
              checked={isSubscription}
              onChange={setIsSubscription}
            />
          </div>
        </fieldset>

        <TextField
          label="Observações (opcional)"
          placeholder="Ex: Código de barras, boleto..."
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
