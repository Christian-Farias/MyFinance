import React, { useState, useMemo } from 'react';
import { Search, Plus, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionItem } from '../components/TransactionItem';
import { formatRelativeDate } from '../calculations/financialCalculations';

export const TransactionsPage: React.FC = () => {
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

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Transações</h1>
        <button
          onClick={() => openNewTxModal('expense')}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 text-[#8B7CFF] text-xs font-semibold hover:bg-[#8B7CFF]/15 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Nova</span>
        </button>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[#0D0F12] border border-[#1D2026] rounded-2xl">
        {[
          { key: 'all' as const, label: 'Todas' },
          { key: 'income' as const, label: 'Receitas' },
          { key: 'expense' as const, label: 'Despesas' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === key
                ? key === 'income'
                  ? 'bg-[#39D98A]/15 text-[#39D98A] shadow-sm'
                  : key === 'expense'
                    ? 'bg-[#FF5C5C]/15 text-[#FF5C5C] shadow-sm'
                    : 'bg-[#121419] text-[#F5F5F5] shadow-sm'
                : 'text-[#8B919B] hover:text-[#F5F5F5]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SEARCH ── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6570]" />
        <input
          type="text"
          placeholder="Buscar transações..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0D0F12] border border-[#1D2026] focus:border-[#8B7CFF] text-xs text-[#F5F5F5] placeholder-[#5F6570] outline-none transition-colors"
        />
      </div>

      {/* ── TRANSACTION LIST ── */}
      {sortedDates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-[#8B7CFF]" />
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">Nenhuma movimentação encontrada</h3>
          <p className="label-xs leading-relaxed mb-5">Adicione uma nova receita ou despesa.</p>
          <button
            onClick={() => openNewTxModal('expense')}
            className="px-5 py-2.5 rounded-xl bg-[#8B7CFF] text-white text-xs font-semibold hover:bg-[#7B6CEF] transition-colors"
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
                      <div key={tx.id} className={idx < txsForDate.length - 1 ? 'border-b border-[#1D2026]' : ''}>
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
