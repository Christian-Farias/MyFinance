import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard, Wallet, Layers, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { TransactionType } from '../../types';
import { AmountField, CheckboxField, Modal, SegmentedControl, SelectField, TextAreaField, TextField } from '../ui';

export const NewTransactionModal: React.FC = () => {
  const { 
    isNewTxModalOpen, 
    closeNewTxModal, 
    newTxDefaultType, 
    transactionToEdit,
    addTransaction,
    updateTransaction,
    accounts, 
    categories, 
    cards 
  } = useFinance();

  const [type, setType] = useState<TransactionType>(newTxDefaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [cardId, setCardId] = useState<string>('');
  const [isCreditCard, setIsCreditCard] = useState<boolean>(false);
  const [isInstallments, setIsInstallments] = useState<boolean>(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isNewTxModalOpen) {
      if (transactionToEdit) {
        // Edit mode
        setType(transactionToEdit.type);
        setAmountStr(transactionToEdit.amount.toString());
        setDescription(transactionToEdit.description);
        setDate(transactionToEdit.date);
        setCategoryId(transactionToEdit.categoryId || 'outros');
        setAccountId(transactionToEdit.accountId || (accounts[0]?.id || ''));
        setDestinationAccountId(transactionToEdit.destinationAccountId || '');
        setCardId(transactionToEdit.cardId || '');
        setIsCreditCard(Boolean(transactionToEdit.cardId));
        setIsInstallments(false);
        setNotes(transactionToEdit.notes || '');
        setErrorMsg('');
      } else {
        // Create mode
        setType(newTxDefaultType);
        setAmountStr('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setIsCreditCard(false);
        setIsInstallments(false);
        setInstallmentsCount(2);
        setNotes('');
        setErrorMsg('');

        // Default category
        const defaultCat = categories.find(c => c.type === (newTxDefaultType === 'income' ? 'income' : 'expense')) || categories[0];
        if (defaultCat) setCategoryId(defaultCat.id);

        // Default account
        if (accounts.length > 0) {
          setAccountId(accounts[0].id);
          if (accounts.length > 1) setDestinationAccountId(accounts[1].id);
        }

        // Default card
        if (cards.length > 0) {
          setCardId(cards[0].id);
        }
      }
    }
  }, [isNewTxModalOpen, newTxDefaultType, transactionToEdit, categories, accounts, cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Informe uma descrição para a transação.');
      return;
    }

    if (type === 'transfer') {
      if (!accountId || !destinationAccountId) {
        setErrorMsg('Selecione as contas de origem e destino.');
        return;
      }
      if (accountId === destinationAccountId) {
        setErrorMsg('A conta de destino não pode ser igual à de origem.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (transactionToEdit) {
        // Update existing transaction
        await updateTransaction({
          ...transactionToEdit,
          type,
          amount: parsedAmount,
          description: description.trim(),
          date,
          categoryId: type === 'transfer' ? 'financas' : categoryId,
          accountId: isCreditCard && type === 'expense' ? undefined : accountId,
          destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
          cardId: isCreditCard && type === 'expense' ? cardId : undefined,
          paymentMethod: isCreditCard ? 'credit_card' : 'account',
          notes: notes.trim() || undefined,
        });
      } else {
        // Create new transaction
        await addTransaction(
          {
            type,
            amount: parsedAmount,
            description: description.trim(),
            date,
            categoryId: type === 'transfer' ? 'financas' : categoryId,
            accountId: isCreditCard && type === 'expense' ? undefined : accountId,
            destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
            cardId: isCreditCard && type === 'expense' ? cardId : undefined,
            paymentMethod: isCreditCard ? 'credit_card' : 'account',
            notes: notes.trim() || undefined,
          },
          isInstallments && isCreditCard && type === 'expense' ? installmentsCount : 1
        );
      }

      closeNewTxModal();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar transação. Verifique os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income' || c.type === 'both';
    if (type === 'expense') return c.type === 'expense' || c.type === 'both';
    return true;
  });

  const accountOptions = accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.institution})` }));
  const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  const installmentOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => ({
    value: String(n),
    label: `${n}x de R$ ${parsedAmount > 0 ? (parsedAmount / n).toFixed(2) : '0,00'}`,
  }));

  return (
    <Modal
      open={isNewTxModalOpen}
      onClose={closeNewTxModal}
      title={transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
      size="lg"
      footer={
        <button
          type="submit"
          form="new-tx-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={18} aria-hidden="true" />
          <span>
            {isSubmitting
              ? 'Salvando…'
              : transactionToEdit
                ? 'Atualizar Transação'
                : 'Salvar Transação'}
          </span>
        </button>
      }
    >
      <form id="new-tx-form" onSubmit={handleSubmit} className="space-y-4">
        <SegmentedControl
          label="Tipo de transação"
          value={type}
          onChange={(v) => {
            setType(v);
            if (v !== 'expense') {
              setIsCreditCard(false);
              setIsInstallments(false);
            }
          }}
          options={[
            { value: 'expense', label: 'Despesa' },
            { value: 'income', label: 'Receita' },
            { value: 'transfer', label: 'Transferência' },
          ]}
        />

        {errorMsg && (
          <p role="alert" className="text-xs text-negative-strong">
            {errorMsg}
          </p>
        )}

        <AmountField
          label="Valor"
          value={amountStr}
          onChange={setAmountStr}
          placeholder="0,00"
          autoFocus
        />

        <TextField
          label="Descrição"
          placeholder="Ex: Mercado, Uber, Salário..."
          value={description}
          onChange={setDescription}
        />

        <TextField label="Data" type="date" value={date} onChange={setDate} />

        {type !== 'transfer' && (
          <SelectField
            label="Categoria"
            value={categoryId}
            onChange={setCategoryId}
            options={filteredCategories.map((cat) => ({ value: cat.id, label: cat.name }))}
          />
        )}

        {type === 'expense' && cards.length > 0 && (
          <fieldset className="pt-2">
            <legend className="field-label">Forma de Pagamento</legend>
            <SegmentedControl
              label="Forma de Pagamento"
              value={isCreditCard ? 'card' : 'account'}
              onChange={(v) => {
                const useCard = v === 'card';
                setIsCreditCard(useCard);
                if (!useCard) setIsInstallments(false);
              }}
              options={[
                { value: 'account', label: 'Conta / Débito' },
                { value: 'card', label: 'Cartão de Crédito' },
              ]}
            />

            {isCreditCard ? (
              <>
                <div className="mt-4">
                  <SelectField
                    label="Qual cartão?"
                    value={cardId}
                    onChange={setCardId}
                    options={cards.map((c) => ({
                      value: c.id,
                      label: `${c.name} (Final ${c.lastDigits || '0000'})`,
                    }))}
                  />
                </div>

                {!transactionToEdit && (
                  <div className="mt-3 p-3 rounded-xl bg-field border border-edge-strong">
                    <CheckboxField
                      label="Parcelar compra?"
                      checked={isInstallments}
                      onChange={setIsInstallments}
                    />
                    {isInstallments && (
                      <div className="mt-3 pt-3 border-t border-edge-strong">
                        <SelectField
                          label="Número de parcelas"
                          value={String(installmentsCount)}
                          onChange={(v) => setInstallmentsCount(parseInt(v, 10))}
                          options={installmentOptions}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4">
                <SelectField
                  label="Conta de Débito"
                  value={accountId}
                  onChange={setAccountId}
                  options={accountOptions}
                />
              </div>
            )}
          </fieldset>
        )}

        {type === 'income' && (
          <SelectField
            label="Receber na Conta"
            value={accountId}
            onChange={setAccountId}
            options={accountOptions}
          />
        )}

        {type === 'transfer' && (
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Origem"
              value={accountId}
              onChange={setAccountId}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
            <SelectField
              label="Destino"
              value={destinationAccountId}
              onChange={setDestinationAccountId}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>
        )}

        <TextAreaField
          label="Observações (opcional)"
          placeholder="Ex: Almoço com cliente, compra parcelada..."
          value={notes}
          onChange={setNotes}
          rows={2}
        />
      </form>
    </Modal>
  );
};
