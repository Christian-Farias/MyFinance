import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Account, AccountType } from '../../types';
import { AmountField, ColorSwatchRow, Modal, SelectField, TextField } from '../ui';

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
  const [color, setColor] = useState(accountToEdit?.color || 'var(--color-accent)');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const accountColors = ['var(--color-accent)', 'var(--color-positive)', 'var(--color-info)', '#FFB74D', '#EC4899', '#8A05BE', 'var(--color-negative-strong)'];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={accountToEdit ? 'Editar Conta' : 'Nova Conta Bancária'}
      size="md"
      footer={
        <button
          type="submit"
          form="account-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (accountToEdit ? 'Atualizar Conta' : 'Criar Conta')}</span>
        </button>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome da Conta"
          placeholder="Ex: Nubank, Itaú Principal..."
          value={name}
          onChange={setName}
        />
        <TextField
          label="Instituição"
          placeholder="Ex: Nubank, Inter, Bradesco..."
          value={institution}
          onChange={setInstitution}
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Tipo de Conta"
            value={type}
            onChange={(v) => setType(v as AccountType)}
            options={[
              { value: 'checking', label: 'Conta Corrente' },
              { value: 'savings', label: 'Poupança' },
              { value: 'cash', label: 'Dinheiro em Espécie' },
              { value: 'digital_wallet', label: 'Carteira Digital' },
              { value: 'investment', label: 'Investimentos' },
              { value: 'other', label: 'Outro' },
            ]}
          />
          <AmountField
            label="Saldo Atual"
            value={initialBalanceStr}
            onChange={setInitialBalanceStr}
            placeholder="0,00"
          />
        </div>

        <ColorSwatchRow
          label="Cor de identificação"
          colors={accountColors}
          value={color}
          onChange={setColor}
        />

        {errorMsg && (
          <p role="alert" className="text-xs text-negative-strong">
            {errorMsg}
          </p>
        )}
      </form>
    </Modal>
  );
};
