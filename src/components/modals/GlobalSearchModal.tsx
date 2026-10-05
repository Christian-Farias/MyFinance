import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Tag, CreditCard, Wallet, Target, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';
import { Modal } from '../ui';

/**
 * Global search (⌘K).
 *
 * Every result row was a `<div onClick>`, so search results were unreachable
 * by keyboard entirely. Rows are now real buttons.
 */
export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setGlobalSearchOpen,
    transactions,
    accounts,
    cards,
    goals,
    investments,
    openTxDetail,
  } = useFinance();

  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // The search had no trigger anywhere in the shell until now.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setGlobalSearchOpen]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    const matchedTxs = transactions.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.amount.toString().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.date.includes(q)
    ).slice(0, 8);

    const matchedAccounts = accounts.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.institution.toLowerCase().includes(q)
    );

    const matchedCards = cards.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.institution.toLowerCase().includes(q) ||
      c.lastDigits?.includes(q)
    );

    const matchedGoals = goals.filter(g =>
      g.name.toLowerCase().includes(q)
    );

    const matchedInvestments = investments.filter(i =>
      i.assetName.toLowerCase().includes(q) ||
      (i.ticker && i.ticker.toLowerCase().includes(q))
    );

    return {
      transactions: matchedTxs,
      accounts: matchedAccounts,
      cards: matchedCards,
      goals: matchedGoals,
      investments: matchedInvestments,
      totalCount: matchedTxs.length + matchedAccounts.length + matchedCards.length + matchedGoals.length + matchedInvestments.length,
    };
  }, [query, transactions, accounts, cards, goals, investments]);

  const close = useCallback(() => {
    setGlobalSearchOpen(false);
    setQuery('');
  }, [setGlobalSearchOpen]);

  const go = useCallback((path: string) => {
    close();
    navigate(path);
  }, [close, navigate]);

  const ResultRow = ({
    icon: Icon,
    iconClass,
    primary,
    secondary,
    trailing,
    onClick,
  }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconClass: string;
    primary: string;
    secondary?: string;
    trailing: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick} className="search-result">
      <Icon size={16} className={iconClass} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-xs font-semibold text-ink">
          {primary}
        </span>
        {secondary && (
          <span className="block truncate text-xs text-ink-muted">
            {secondary}
          </span>
        )}
      </span>
      <span className="shrink-0 text-xs font-semibold">{trailing}</span>
    </button>
  );

  return (
    <Modal
      open={isGlobalSearchOpen}
      onClose={close}
      title="Busca global"
      variant="command"
      hideTitle
      closeOnBackdrop
    >
      <div className="relative flex items-center pb-3 border-b border-active">
        <Search size={20} className="text-accent-text mr-3 shrink-0" aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar por mercado, uber, cartão, viagem..."
          aria-label="Buscar em todas as finanças"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          data-autofocus
          className="w-full bg-transparent text-ink font-medium text-base placeholder-ink-faint focus:outline-none"
        />
      </div>

      <div className="pt-4 flex-1 min-h-0 overflow-y-auto space-y-5">
        {!query && (
          <div className="py-8 text-center">
            <Search
              size={32}
              className="mx-auto mb-3 opacity-30 text-accent-text"
              aria-hidden="true"
            />
            <p className="text-sm text-ink-muted">
              Digite o que procura em finanças...
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {['Uber', 'Mercado', 'Nubank', 'Salário', 'PC'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 rounded-xl bg-field border border-active text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {results && results.totalCount === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-ink-muted">
              Nenhum resultado encontrado para &quot;{query}&quot;.
            </p>
          </div>
        )}

        {results && results.transactions.length > 0 && (
          <div>
            <p className="label-section">Transações ({results.transactions.length})</p>
            <div className="space-y-1.5">
              {results.transactions.map((tx) => (
                <ResultRow
                  key={tx.id}
                  icon={Tag}
                  iconClass="text-ink-muted"
                  primary={tx.description}
                  secondary={formatDateBR(tx.date)}
                  trailing={
                    <span className={tx.type === 'income' ? 'text-positive' : 'text-ink'}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  }
                  onClick={() => {
                    close();
                    openTxDetail(tx);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {results && results.accounts.length > 0 && (
          <div>
            <p className="label-section">Contas ({results.accounts.length})</p>
            <div className="space-y-1.5">
              {results.accounts.map((acc) => (
                <ResultRow
                  key={acc.id}
                  icon={Wallet}
                  iconClass="text-info"
                  primary={acc.name}
                  secondary={acc.institution}
                  trailing={
                    <span className="text-positive">
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  }
                  onClick={() => go('/contas')}
                />
              ))}
            </div>
          </div>
        )}

        {results && results.cards.length > 0 && (
          <div>
            <p className="label-section">Cartões ({results.cards.length})</p>
            <div className="space-y-1.5">
              {results.cards.map((c) => (
                <ResultRow
                  key={c.id}
                  icon={CreditCard}
                  iconClass="text-accent-text"
                  primary={c.name}
                  secondary={`•••• ${c.lastDigits}`}
                  trailing={
                    <span className="text-ink-muted">
                      Disp: {formatCurrency(c.availableLimit)}
                    </span>
                  }
                  onClick={() => go('/cartoes')}
                />
              ))}
            </div>
          </div>
        )}

        {results && results.goals.length > 0 && (
          <div>
            <p className="label-section">Metas ({results.goals.length})</p>
            <div className="space-y-1.5">
              {results.goals.map((g) => (
                <ResultRow
                  key={g.id}
                  icon={Target}
                  iconClass="text-info"
                  primary={g.name}
                  trailing={
                    <span className="text-ink-muted">
                      {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                    </span>
                  }
                  onClick={() => go('/metas')}
                />
              ))}
            </div>
          </div>
        )}

        {results && results.investments.length > 0 && (
          <div>
            <p className="label-section">Investimentos ({results.investments.length})</p>
            <div className="space-y-1.5">
              {results.investments.map((inv) => (
                <ResultRow
                  key={inv.id}
                  icon={LineChart}
                  iconClass="text-positive"
                  primary={inv.assetName + (inv.ticker ? ` (${inv.ticker})` : '')}
                  trailing={
                    <span className="text-ink">
                      {formatCurrency(inv.currentValue)}
                    </span>
                  }
                  onClick={() => go('/investimentos')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};