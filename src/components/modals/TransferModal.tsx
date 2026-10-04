import React, { useState } from 'react';
import { X, Check, ArrowRightLeft, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../calculations/financialCalculations';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'account_transfer' | 'card_payment';
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, defaultMode = 'account_transfer' }) => {
  const { accounts, cards, transferBetweenAccounts, payCreditCardInvoice, selectedPeriod } = useFinance();

  const [mode, setMode] = useState<'account_transfer' | 'card_payment'>(defaultMode);
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedCard = cards.find(c => c.id === cardId);
  const cardDebt = selectedCard ? Math.max(0, selectedCard.limit - selectedCard.availableLimit) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    if (amount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero.');
      return;
    }

    if (mode === 'account_transfer') {
      if (!sourceAccountId || !destinationAccountId) {
        setErrorMsg('Selecione as contas de origem e destino.');
        return;
      }
      if (sourceAccountId === destinationAccountId) {
        setErrorMsg('A conta de destino não pode ser igual à de origem.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (mode === 'account_transfer') {
        await transferBetweenAccounts({
          sourceAccountId,
          destinationAccountId,
          amount,
          date,
          description: description.trim() || undefined,
        });
      } else {
        await payCreditCardInvoice({
          cardId,
          accountId: sourceAccountId,
          invoiceMonthYear: selectedPeriod,
          amount,
          paymentDate: date,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar transferência.');
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
            {mode === 'account_transfer' ? 'Transferência entre Contas' : 'Pagamento de Fatura'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode switcher */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-[#0D0F12] rounded-2xl border border-[#222733]">
          <button
            type="button"
            onClick={() => setMode('account_transfer')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'account_transfer' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-[#8E95A3]'
            }`}
          >
            Entre Contas
          </button>
          <button
            type="button"
            onClick={() => setMode('card_payment')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'card_payment' ? 'bg-[#8B7CFF] text-white shadow-md' : 'text-[#8E95A3]'
            }`}
          >
            Pagar Fatura
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8E95A3]">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder={mode === 'card_payment' && cardDebt > 0 ? cardDebt.toFixed(2) : '0,00'}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-xl font-bold text-white placeholder-[#5F6570]"
              />
            </div>
            {mode === 'card_payment' && cardDebt > 0 && (
              <button
                type="button"
                onClick={() => setAmountStr(cardDebt.toFixed(2))}
                className="text-[11px] text-[#8B7CFF] hover:underline mt-1 block"
              >
                Pagar valor total da fatura ({formatCurrency(cardDebt)})
              </button>
            )}
          </div>

          {mode === 'account_transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8E95A3] mb-1">Conta de Origem</label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8E95A3] mb-1">Conta de Destino</label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8E95A3] mb-1">Debitar da Conta</label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#1A1F29] text-white">
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8E95A3] mb-1">Cartão a Pagar</label>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#1A1F29] text-white">
                      {c.name} (•••• {c.lastDigits})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Data da Operação</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                mode === 'account_transfer' 
                  ? 'bg-[#3B82F6] hover:bg-[#2f6ed4] shadow-[#3B82F6]/20' 
                  : 'bg-[#8B7CFF] hover:bg-[#7a6aeb] shadow-[#8B7CFF]/20'
              }`}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Processando...' : (mode === 'account_transfer' ? 'Confirmar Transferência' : 'Confirmar Pagamento')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
