import React, { useState, useMemo } from 'react';
import { X, Search, Tag, CreditCard, Wallet, Target, LineChart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateBR } from '../../calculations/financialCalculations';
import { useNavigate } from 'react-router-dom';

export const GlobalSearchModal: React.FC = () => {
  const { 
    isGlobalSearchOpen, 
    setGlobalSearchOpen, 
    transactions, 
    accounts, 
    cards, 
    goals, 
    investments,
    openTxDetail 
  } = useFinance();

  const [query, setQuery] = useState('');
  const navigate = useNavigate();

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
      totalCount: matchedTxs.length + matchedAccounts.length + matchedCards.length + matchedGoals.length + matchedInvestments.length
    };
  }, [query, transactions, accounts, cards, goals, investments]);

  if (!isGlobalSearchOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setGlobalSearchOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-[#14171D] border border-[#222733] rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center mb-4 pb-3 border-b border-[#222733]">
          <Search size={20} className="text-[#8B7CFF] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por mercado, uber, cartão, viagem..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white font-medium text-base placeholder-[#5F6570] focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#8E95A3] hover:text-white mr-2"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setGlobalSearchOpen(false)}
            className="p-1 rounded-lg text-xs font-mono text-[#8E95A3] hover:text-white bg-[#1A1F29] px-2 py-1"
          >
            ESC
          </button>
        </div>

        {/* Content / Results */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {!query && (
            <div className="py-8 text-center text-[#8E95A3]">
              <Search size={32} className="mx-auto mb-3 opacity-30 text-[#8B7CFF]" />
              <p className="text-sm">Digite o que procura em finanças...</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {['Uber', 'Mercado', 'Nubank', 'Salário', 'PC'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-[#8E95A3] hover:text-white transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <div className="py-8 text-center text-[#8E95A3]">
              <p className="text-sm">Nenhum resultado encontrado para &quot;{query}&quot;.</p>
            </div>
          )}

          {/* Transactions section */}
          {results && results.transactions.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#5F6570] uppercase tracking-wider block mb-2">
                Transações ({results.transactions.length})
              </span>
              <div className="space-y-1.5">
                {results.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      openTxDetail(tx);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1A1F29] hover:bg-[#222733] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag size={16} className="text-[#8E95A3]" />
                      <div>
                        <h5 className="text-xs font-semibold text-white">{tx.description}</h5>
                        <span className="text-[11px] text-[#8E95A3]">{formatDateBR(tx.date)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${tx.type === 'income' ? 'text-[#39D98A]' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accounts section */}
          {results && results.accounts.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#5F6570] uppercase tracking-wider block mb-2">
                Contas ({results.accounts.length})
              </span>
              <div className="space-y-1.5">
                {results.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate('/contas');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1A1F29] hover:bg-[#222733] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet size={16} className="text-[#3B82F6]" />
                      <span className="text-xs font-semibold text-white">{acc.name} ({acc.institution})</span>
                    </div>
                    <span className="text-xs font-semibold text-[#39D98A]">
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards section */}
          {results && results.cards.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#5F6570] uppercase tracking-wider block mb-2">
                Cartões ({results.cards.length})
              </span>
              <div className="space-y-1.5">
                {results.cards.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate('/cartoes');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1A1F29] hover:bg-[#222733] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard size={16} className="text-[#8B7CFF]" />
                      <span className="text-xs font-semibold text-white">{c.name} (•••• {c.lastDigits})</span>
                    </div>
                    <span className="text-xs text-[#8E95A3]">
                      Disp: {formatCurrency(c.availableLimit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals section */}
          {results && results.goals.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#5F6570] uppercase tracking-wider block mb-2">
                Metas ({results.goals.length})
              </span>
              <div className="space-y-1.5">
                {results.goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate('/metas');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1A1F29] hover:bg-[#222733] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Target size={16} className="text-[#38BDF8]" />
                      <span className="text-xs font-semibold text-white">{g.name}</span>
                    </div>
                    <span className="text-xs text-[#8E95A3]">
                      {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investments section */}
          {results && results.investments.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#5F6570] uppercase tracking-wider block mb-2">
                Investimentos ({results.investments.length})
              </span>
              <div className="space-y-1.5">
                {results.investments.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setGlobalSearchOpen(false);
                      navigate('/investimentos');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1A1F29] hover:bg-[#222733] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <LineChart size={16} className="text-[#39D98A]" />
                      <span className="text-xs font-semibold text-white">{inv.assetName} {inv.ticker ? `(${inv.ticker})` : ''}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {formatCurrency(inv.currentValue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
