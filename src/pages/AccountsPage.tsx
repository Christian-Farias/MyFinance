import React, { useState } from 'react';
import { Plus, Wallet, ArrowLeftRight, Trash2, Edit2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { AccountModal } from '../components/modals/AccountModal';
import { formatCurrency } from '../calculations/financialCalculations';
import type { Account } from '../types';
import { ErrorState, LoadingState } from '../components/ui';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  cash: 'Dinheiro em Espécie',
  digital_wallet: 'Carteira Digital',
  investment: 'Investimentos',
};

export const AccountsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { accounts, deleteAccount, openNewTxModal } = useFinance();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | undefined>(undefined);

  const totalBalance = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);

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
        <h1 className="text-2xl font-bold text-ink tracking-tight">Contas</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openNewTxModal('transfer')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface border border-edge text-ink-muted text-xs font-semibold hover:text-ink hover:border-edge-strong transition-colors"
          >
            <ArrowLeftRight size={14} />
            <span>Transferir</span>
          </button>
          <button
            onClick={() => { setAccountToEdit(undefined); setIsAccountModalOpen(true); }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Nova conta</span>
          </button>
        </div>
      </div>

      {/* ── TOTAL BALANCE ── */}
      <div className="card p-5">
        <p className="label-xs mb-2">Saldo total disponível</p>
        <p className="num-xl mb-1">{formatCurrency(totalBalance)}</p>
        <p className="label-xs">
          Distribuído em {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── ACCOUNTS LIST ── */}
      {accounts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-3xl bg-positive/10 flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-positive" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-2">Nenhuma conta cadastrada</h3>
          <p className="label-xs leading-relaxed mb-5">Adicione suas contas bancárias para acompanhar seus saldos.</p>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="btn btn-primary"
          >
            Adicionar conta
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 stagger">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="animate-fade-in card p-4 flex items-center justify-between group card-hover"
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-ink text-sm shrink-0"
                  style={{ backgroundColor: acc.color || 'var(--color-accent)' }}
                >
                  {acc.institution.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">{acc.name}</h4>
                  <p className="label-xs mt-0.5">
                    {acc.institution} · {ACCOUNT_TYPE_LABELS[acc.type] || 'Outro'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="label-xs mb-0.5">Saldo</p>
                  <p className={`text-sm font-bold ${acc.currentBalance >= 0 ? 'text-ink' : 'text-negative'}`}>
                    {formatCurrency(acc.currentBalance)}
                  </p>
                </div>

                <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setAccountToEdit(acc); setIsAccountModalOpen(true); }}
                    className="w-8 h-8 rounded-lg bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
                    title="Editar"
                    aria-label={`Editar conta ${acc.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="w-8 h-8 rounded-lg bg-surface-raised text-negative/60 hover:text-negative flex items-center justify-center transition-colors"
                    title="Excluir"
                    aria-label={`Excluir conta ${acc.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountToEdit={accountToEdit}
      />
    </div>
  );
};
