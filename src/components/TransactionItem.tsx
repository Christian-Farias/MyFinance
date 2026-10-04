import React from 'react';
import type { Transaction, Category, Account, CreditCard } from '../types';
import { formatCurrency, formatRelativeDate } from '../calculations/financialCalculations';
import { CategoryIcon } from './CategoryIcon';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  card?: CreditCard;
  onClick?: () => void;
  showDate?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  account,
  card,
  onClick,
  showDate = false,
}) => {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const sourceName = card ? card.name : account ? account.name : 'Conta';
  const catName = category ? category.name : 'Outros';
  const installmentText =
    transaction.installmentNumber && transaction.installmentTotal
      ? ` · ${transaction.installmentNumber}/${transaction.installmentTotal}`
      : '';
  const dateText = showDate ? ` · ${formatRelativeDate(transaction.date)}` : '';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-raised active:scale-[0.99] transition-all cursor-pointer group"
    >
      <div className="flex items-center space-x-3 min-w-0">
        <CategoryIcon
          iconName={category?.icon || (isIncome ? 'wallet' : 'tag')}
          color={category?.color || (isIncome ? 'var(--color-positive)' : 'var(--color-ink-muted)')}
          size={18}
        />
        <div className="min-w-0">
          <h4 className="text-ink font-medium text-xs truncate group-hover:text-ink transition-colors">
            {transaction.description}
          </h4>
          <p className="text-ink-faint text-[11px] truncate mt-0.5">
            {catName} · {sourceName}{installmentText}{dateText}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <span
          className={`font-bold text-xs tracking-tight ${
            isIncome
              ? 'text-positive'
              : isTransfer
                ? 'text-accent'
                : 'text-ink'
          }`}
        >
          {isIncome ? '+' : isTransfer ? '' : '−'}{' '}
          {formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  );
};
