import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard, Wallet, Layers, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { TransactionType } from '../../types';

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

  if (!isNewTxModalOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-lg bg-[#14171D] border border-[#222733] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#222733]">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button
            onClick={closeNewTxModal}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 my-4 sm:my-5 p-1 bg-[#0D0F12] rounded-2xl border border-[#222733]">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              type === 'expense'
                ? 'bg-[#FF5555] text-white shadow-md'
                : 'text-[#8E95A3] hover:text-white'
            }`}
          >
            <ArrowDownLeft size={15} />
            <span>Despesa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('income');
              setIsCreditCard(false);
              setIsInstallments(false);
            }}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              type === 'income'
                ? 'bg-[#39D98A] text-[#0D0F12] font-bold shadow-md'
                : 'text-[#8E95A3] hover:text-white'
            }`}
          >
            <ArrowUpRight size={15} />
            <span>Receita</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('transfer');
              setIsCreditCard(false);
              setIsInstallments(false);
            }}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              type === 'transfer'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'text-[#8E95A3] hover:text-white'
            }`}
          >
            <ArrowLeftRight size={15} />
            <span>Transferência</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#8E95A3]">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xl sm:text-2xl font-bold text-white placeholder-[#5F6570]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Mercado, Uber, Salário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs sm:text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Data</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          {/* Category (if not transfer) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs sm:text-sm text-white cursor-pointer"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#1A1F29] text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Expense: Choose Payment Source (Account vs Credit Card) */}
          {type === 'expense' && cards.length > 0 && (
            <div className="pt-2">
              <label className="block text-xs font-medium text-[#8E95A3] mb-1.5">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => { setIsCreditCard(false); setIsInstallments(false); }}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                    !isCreditCard
                      ? 'border-[#8B7CFF] bg-[#8B7CFF]/15 text-white'
                      : 'border-[#262C3A] bg-[#1A1F29] text-[#8E95A3]'
                  }`}
                >
                  <Wallet size={15} />
                  <span>Conta / Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreditCard(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                    isCreditCard
                      ? 'border-[#8B7CFF] bg-[#8B7CFF]/15 text-white'
                      : 'border-[#262C3A] bg-[#1A1F29] text-[#8E95A3]'
                  }`}
                >
                  <CreditCard size={15} />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {isCreditCard ? (
                <div>
                  <label className="block text-xs font-medium text-[#8E95A3] mb-1">Qual cartão?</label>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs sm:text-sm text-white cursor-pointer"
                  >
                    {cards.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#1A1F29] text-white">
                        {c.name} (Final {c.lastDigits || '0000'})
                      </option>
                    ))}
                  </select>

                  {/* Installments Option (only on create mode) */}
                  {!transactionToEdit && (
                    <div className="mt-3 p-3 rounded-xl bg-[#1A1F29] border border-[#262C3A]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Layers size={16} className="text-[#8B7CFF]" />
                          <span className="text-xs font-medium text-white">Parcelar compra?</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isInstallments}
                          onChange={(e) => setIsInstallments(e.target.checked)}
                          className="w-4 h-4 accent-[#8B7CFF] cursor-pointer"
                        />
                      </div>

                      {isInstallments && (
                        <div className="mt-3 pt-3 border-t border-[#262C3A]">
                          <label className="block text-xs text-[#8E95A3] mb-1">Número de parcelas</label>
                          <select
                            value={installmentsCount}
                            onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 rounded-lg bg-[#0D0F12] border border-[#262C3A] text-xs text-white"
                          >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => {
                              const val = parseFloat(amountStr.replace(',', '.')) || 0;
                              const installmentVal = val > 0 ? (val / n).toFixed(2) : '0,00';
                              return (
                                <option key={n} value={n} className="bg-[#0D0F12] text-white">
                                  {n}x de R$ {installmentVal}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#8E95A3] mb-1">Conta de Débito</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs sm:text-sm text-white cursor-pointer"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                        {a.name} ({a.institution})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* If Income: Select Account */}
          {type === 'income' && (
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Receber na Conta</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs sm:text-sm text-white cursor-pointer"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                    {a.name} ({a.institution})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Transfer: Origin and Destination Accounts */}
          {type === 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8E95A3] mb-1">Origem</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8E95A3] mb-1">Destino</label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Almoço com cliente, compra parcelada..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] focus:outline-none text-xs text-white placeholder-[#5F6570]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
            >
              <Check size={18} />
              <span>
                {isSubmitting 
                  ? 'Salvando...' 
                  : (transactionToEdit ? 'Atualizar Transação' : 'Salvar Transação')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
