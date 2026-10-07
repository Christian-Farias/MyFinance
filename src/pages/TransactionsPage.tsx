import React, { useState, useMemo } from 'react';
import { Search, Plus,   Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { TransactionItem } from '../components/TransactionItem';
import { formatRelativeDate } from '../calculations/financialCalculations';
import { ErrorState, LoadingState } from '../components/ui';

export const TransactionsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const {
    transactions,
    categories,
    accounts,
    cards,
    openNewTxModal,
    openTxDetail,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (activeTab === 'income' && t.type !== 'income') return false;
      if (activeTab === 'expense' && t.type !== 'expense') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        const category = categories.find(c => c.id === t.categoryId);
        const matchesCat = category?.name.toLowerCase().includes(q);
        return matchesDesc || matchesAmount || matchesCat;
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery, categories]);

  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: typeof filteredTransactions } = {};
    for (const t of filteredTransactions) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    }
    return groups;
  }, [filteredTransactions]);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  /* Sem esta guarda a página desenhava o estado vazio antes de o IndexedDB
     responder — e uma falha de leitura ficava idêntica a "não há dados". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Transações</h1>
        <button
          onClick={() => openNewTxModal('expense')}
          className="btn btn-primary btn-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Nova</span>
        </button>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-surface border border-edge rounded-2xl">
        {[
          { key: 'all' as const, label: 'Todas' },
          { key: 'income' as const, label: 'Receitas' },
          { key: 'expense' as const, label: 'Despesas' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
              className={`py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === key
                ? key === 'income'
                  ? 'bg-positive-subtle text-positive'
                  : key === 'expense'
                    ? 'bg-negative-subtle text-negative'
                    : 'bg-surface-raised text-ink'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SEARCH ── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Buscar transações..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface border border-edge focus:border-accent text-xs text-ink placeholder-ink-faint outline-none transition-colors"
        />
      </div>

      {/* ── TRANSACTION LIST ── */}
      {sortedDates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-accent-text" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-2">Nenhuma movimentação encontrada</h3>
          <p className="label-xs leading-relaxed mb-5">Adicione uma nova receita ou despesa.</p>
          <button
            onClick={() => openNewTxModal('expense')}
            className="btn btn-primary"
          >
            Nova transação
          </button>
        </div>
      ) : (
        <div className="space-y-5 stagger">
          {sortedDates.map(dateStr => {
            const txsForDate = groupedByDate[dateStr];
            return (
              <div key={dateStr} className="animate-fade-in">
                <span className="label-xs uppercase tracking-wider px-0.5 mb-2 block">
                  {formatRelativeDate(dateStr)}
                </span>
                <div className="card overflow-hidden">
                  {txsForDate.map((tx, idx) => {
                    const category = categories.find(c => c.id === tx.categoryId);
                    const account = accounts.find(a => a.id === tx.accountId);
                    const card = cards.find(c => c.id === tx.cardId);
                    return (
                      <div key={tx.id} className={idx < txsForDate.length - 1 ? 'border-b border-edge' : ''}>
                        <TransactionItem
                          transaction={tx}
                          category={category}
                          account={account}
                          card={card}
                          onClick={() => openTxDetail(tx)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
