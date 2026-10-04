import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../context/FinanceContext';
import type { Goal } from '../../types';
import { formatCurrency } from '../../calculations/financialCalculations';

interface GoalDepositModalProps {
  goal: Goal | null;
  onClose: () => void;
}

export const GoalDepositModal: React.FC<GoalDepositModalProps> = ({ goal, onClose }) => {
  const { depositToGoal, withdrawFromGoal, accounts } = useFinance();
  const [isDeposit, setIsDeposit] = useState(true);
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(',', '.')) || 0;
    if (amount <= 0) {
      setErrorMsg('Informe um valor maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isDeposit) {
        await depositToGoal(goal.id, amount, accountId || undefined);
        const newTotal = goal.currentAmount + amount;
        if (newTotal >= goal.targetAmount) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        await withdrawFromGoal(goal.id, amount, accountId || undefined);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao atualizar valor da meta.');
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
          <div>
            <h3 className="text-base font-bold text-white">{goal.name}</h3>
            <p className="text-xs text-[#8E95A3]">
              Atual: {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggle Deposit / Withdraw */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-[#0D0F12] rounded-2xl border border-[#222733]">
          <button
            type="button"
            onClick={() => setIsDeposit(true)}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              isDeposit ? 'bg-[#39D98A] text-[#0D0F12] font-bold shadow-md' : 'text-[#8E95A3] hover:text-white'
            }`}
          >
            <ArrowUpRight size={15} />
            <span>Guardar Dinheiro</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeposit(false)}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              !isDeposit ? 'bg-[#FF5555] text-white shadow-md' : 'text-[#8E95A3] hover:text-white'
            }`}
          >
            <ArrowDownLeft size={15} />
            <span>Retirar Dinheiro</span>
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">
              Valor a {isDeposit ? 'adicionar' : 'retirar'} (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8E95A3]">R$</span>
              <input
                type="number"
                step="0.01"
                placeholder="100,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-xl font-bold text-white placeholder-[#5F6570]"
              />
            </div>
          </div>

          {accounts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">
                {isDeposit ? 'Debitar da Conta' : 'Depositar na Conta'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              >
                <option value="">Nenhuma (Não alterar saldo da conta)</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-[#1A1F29] text-white">
                    {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                isDeposit 
                  ? 'bg-[#39D98A] text-[#0D0F12] font-bold shadow-[#39D98A]/20 hover:bg-[#32c57c]' 
                  : 'bg-[#FF5555] text-white shadow-[#FF5555]/20 hover:bg-[#eb4b4b]'
              }`}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Processando...' : (isDeposit ? 'Confirmar Aporte' : 'Confirmar Resgate')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
