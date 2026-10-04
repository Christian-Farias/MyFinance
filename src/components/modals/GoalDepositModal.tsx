import React, { useState } from 'react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../context/FinanceContext';
import type { Goal } from '../../types';
import { formatCurrency } from '../../calculations/financialCalculations';
import { AmountField, Modal, SegmentedControl, SelectField } from '../ui';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
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

  const accountOptions = [
    { value: '', label: 'Nenhuma (não alterar saldo da conta)' },
    ...accounts.map((acc) => ({
      value: acc.id,
      label: `${acc.name} (Saldo: ${formatCurrency(acc.currentBalance)})`,
    })),
  ];

  return (
    <Modal
      open={Boolean(goal)}
      onClose={onClose}
      title={goal?.name ?? ''}
      subtitle={
        goal ? `Atual: ${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)}` : undefined
      }
      size="md"
      footer={
        <button
          type="submit"
          form="goal-deposit-form"
          disabled={isSubmitting}
          className={`btn btn-block ${isDeposit ? 'btn-positive' : 'btn-negative'}`}
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Processando…' : isDeposit ? 'Confirmar Aporte' : 'Confirmar Resgate'}</span>
        </button>
      }
    >
      <form id="goal-deposit-form" onSubmit={handleSubmit} className="space-y-4">
        <SegmentedControl
          value={isDeposit ? 'deposit' : 'withdraw'}
          onChange={(v) => setIsDeposit(v === 'deposit')}
          label="Operação na meta"
          options={[
            { value: 'deposit', label: 'Guardar Dinheiro' },
            { value: 'withdraw', label: 'Retirar Dinheiro' },
          ]}
        />

        <AmountField
          label={isDeposit ? 'Valor a adicionar' : 'Valor a retirar'}
          value={amountStr}
          onChange={setAmountStr}
          placeholder="100,00"
          error={errorMsg || undefined}
          autoFocus
        />

        {accounts.length > 0 && (
          <SelectField
            label={isDeposit ? 'Debitar da Conta' : 'Depositar na Conta'}
            value={accountId}
            onChange={setAccountId}
            options={accountOptions}
          />
        )}
      </form>
    </Modal>
  );
};
