import React, { useState } from 'react';
import { Plus, Wallet, ArrowLeftRight, Trash2, Edit2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { AccountModal } from '../components/modals/AccountModal';
import { formatCurrency } from '../calculations/financialCalculations';
import type { Account } from '../types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  cash: 'Dinheiro em Espécie',
  digital_wallet: 'Carteira Digital',
  investment: 'Investimentos',
};

export const AccountsPage: React.FC = () => {
  const { accounts, deleteAccount, openNewTxModal } = useFinance();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | undefined>(undefined);

  const totalBalance = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in pb-24 px-1">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Contas</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openNewTxModal('transfer')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#0D0F12] border border-[#1D2026] text-[#8B919B] text-xs font-semibold hover:text-[#F5F5F5] hover:border-[#272B34] transition-colors"
          >
            <ArrowLeftRight size={14} />
            <span>Transferir</span>
          </button>
          <button
            onClick={() => { setAccountToEdit(undefined); setIsAccountModalOpen(true); }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 text-[#8B7CFF] text-xs font-semibold hover:bg-[#8B7CFF]/15 transition-colors"
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
          <div className="w-14 h-14 rounded-3xl bg-[#39D98A]/10 flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-[#39D98A]" />
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">Nenhuma conta cadastrada</h3>
          <p className="label-xs leading-relaxed mb-5">Adicione suas contas bancárias para acompanhar seus saldos.</p>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#8B7CFF] text-white text-xs font-semibold hover:bg-[#7B6CEF] transition-colors"
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
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: acc.color || '#8B7CFF' }}
                >
                  {acc.institution.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F5F5]">{acc.name}</h4>
                  <p className="label-xs mt-0.5">
                    {acc.institution} · {ACCOUNT_TYPE_LABELS[acc.type] || 'Outro'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="label-xs mb-0.5">Saldo</p>
                  <p className={`text-sm font-bold ${acc.currentBalance >= 0 ? 'text-[#F5F5F5]' : 'text-[#FF5C5C]'}`}>
                    {formatCurrency(acc.currentBalance)}
                  </p>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setAccountToEdit(acc); setIsAccountModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-[#121419] text-[#8B919B] hover:text-[#F5F5F5] transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="p-1.5 rounded-lg bg-[#121419] text-[#FF5C5C]/50 hover:text-[#FF5C5C] transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
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
