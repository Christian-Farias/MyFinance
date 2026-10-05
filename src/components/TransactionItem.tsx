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

  /* The row is the app's primary list interaction, and as a
     <div onClick> it was unreachable by keyboard and invisible to
     assistive tech — WCAG 2.1.1. A real <button> gets the global
     :focus-visible ring for free and restores role/activation. */
  const interactive = typeof onClick === 'function';

  const rowClass =
    'flex w-full items-center justify-between px-4 py-3.5 text-left group ' +
    (interactive
      ? 'cursor-pointer hover:bg-surface-raised active:scale-[0.99] transition-all'
      : '');

  const body = (
    <>
      <div className="flex items-center space-x-3 min-w-0">
        <CategoryIcon
          iconName={category?.icon || (isIncome ? 'wallet' : 'tag')}
          color={category?.color || (isIncome ? 'var(--color-positive)' : 'var(--color-ink-muted)')}
          size={18}
        />
        <div className="min-w-0">
          <span className="block text-ink font-medium text-sm truncate group-hover:text-ink transition-colors">
            {transaction.description}
          </span>
          <span className="block text-ink-faint text-xs truncate mt-0.5">
            {catName} · {sourceName}{installmentText}{dateText}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <span
          className={`font-bold text-sm tracking-tight ${
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
    </>
  );

  /* Without an onClick a <button> would be focusable but inert, which
     is worse than plain markup — fall back to a div. */
  if (!interactive) return <div className={rowClass}>{body}</div>;

  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {body}
    </button>
  );
};
