import React, { useState } from 'react';
import { X, Building2, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Account, AccountType } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit
}) => {
  const { addAccount, updateAccount } = useFinance();

  const [name, setName] = useState(accountToEdit?.name || '');
  const [institution, setInstitution] = useState(accountToEdit?.institution || '');
  const [type, setType] = useState<AccountType>(accountToEdit?.type || 'checking');
  const [initialBalanceStr, setInitialBalanceStr] = useState(accountToEdit ? accountToEdit.currentBalance.toString() : '');
  const [color, setColor] = useState(accountToEdit?.color || '#8B7CFF');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome da conta.');
      return;
    }
    const balance = parseFloat(initialBalanceStr.replace(',', '.')) || 0;

    try {
      setIsSubmitting(true);
      if (accountToEdit) {
        await updateAccount({
          ...accountToEdit,
          name: name.trim(),
          institution: institution.trim() || name.trim(),
          type,
          color,
          currentBalance: balance
        });
      } else {
        await addAccount({
          name: name.trim(),
          institution: institution.trim() || name.trim(),
          type,
          initialBalance: balance,
          currentBalance: balance,
          color
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountColors = ['#8B7CFF', '#39D98A', '#3B82F6', '#FFB74D', '#EC4899', '#8A05BE', '#FF5555'];

  return (
    <div className="modal-overlay">
      <div 
        className="modal-panel w-full sm:max-w-md px-5 sm:px-6 pt-5 sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {accountToEdit ? 'Editar Conta' : 'Nova Conta Bancária'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Nome da Conta</label>
            <input
              type="text"
              placeholder="Ex: Nubank, Itaú Principal..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Instituição</label>
            <input
              type="text"
              placeholder="Ex: Nubank, Inter, Bradesco..."
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Tipo de Conta</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança</option>
                <option value="cash">Dinheiro em Espécie</option>
                <option value="digital_wallet">Carteira Digital</option>
                <option value="investment">Investimentos</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Saldo Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={initialBalanceStr}
                onChange={(e) => setInitialBalanceStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-medium placeholder-[#5F6570]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1.5">Cor de identificação</label>
            <div className="flex items-center space-x-2">
              {accountColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : (accountToEdit ? 'Atualizar Conta' : 'Criar Conta')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
