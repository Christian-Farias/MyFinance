import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { CreditCard as ICreditCard, CardBrand } from '../../types';
import { AmountField, ColorSwatchRow, Modal, SelectField, TextField } from '../ui';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: ICreditCard;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  cardToEdit
}) => {
  const { addCard, updateCard } = useFinance();

  const [name, setName] = useState(cardToEdit?.name || '');
  const [institution, setInstitution] = useState(cardToEdit?.institution || '');
  const [brand, setBrand] = useState<CardBrand>(cardToEdit?.brand || 'mastercard');
  const [limitStr, setLimitStr] = useState(cardToEdit ? cardToEdit.limit.toString() : '');
  const [closingDay, setClosingDay] = useState(cardToEdit ? cardToEdit.closingDay : 5);
  const [dueDay, setDueDay] = useState(cardToEdit ? cardToEdit.dueDay : 12);
  const [lastDigits, setLastDigits] = useState(cardToEdit?.lastDigits || '');
  const [color, setColor] = useState(cardToEdit?.color || 'var(--color-accent)');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do cartão.');
      return;
    }
    const limit = parseFloat(limitStr.replace(',', '.')) || 0;
    if (limit <= 0) {
      setErrorMsg('Informe um limite válido maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (cardToEdit) {
        await updateCard({
          ...cardToEdit,
          name: name.trim(),
          institution: institution.trim() || name.trim(),
          brand,
          limit,
          closingDay,
          dueDay,
          lastDigits: lastDigits.slice(-4),
          color
        });
      } else {
        await addCard({
          name: name.trim(),
          institution: institution.trim() || name.trim(),
          brand,
          limit,
          closingDay,
          dueDay,
          lastDigits: lastDigits.slice(-4) || '1234',
          color,
          isActive: true
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar cartão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardColors = ['var(--color-accent)', 'var(--color-positive)', 'var(--color-info)', '#FFB74D', '#EC4899', '#8A05BE', '#1E293B'];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={cardToEdit ? 'Editar Cartão' : 'Novo Cartão'}
      size="md"
      footer={
        <button
          type="submit"
          form="card-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (cardToEdit ? 'Atualizar Cartão' : 'Criar Cartão')}</span>
        </button>
      }
    >
      <form id="card-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome do Cartão"
          placeholder="Ex: Nubank Ultravioleta, Inter Black..."
          value={name}
          onChange={setName}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField label="Banco / Emissor" placeholder="Ex: Nubank" value={institution} onChange={setInstitution} />
          <SelectField
            label="Bandeira"
            value={brand}
            onChange={(v) => setBrand(v as CardBrand)}
            options={[
              { value: 'mastercard', label: 'Mastercard' },
              { value: 'visa', label: 'Visa' },
              { value: 'elo', label: 'Elo' },
              { value: 'amex', label: 'American Express' },
              { value: 'other', label: 'Outra' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AmountField label="Limite Total" value={limitStr} onChange={setLimitStr} placeholder="3000,00" />
          <TextField label="Últimos 4 dígitos" value={lastDigits} onChange={setLastDigits} placeholder="4821" maxLength={4} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Dia de Fechamento"
            type="number"
            value={String(closingDay)}
            onChange={(v) => setClosingDay(parseInt(v, 10) || 1)}
            min={1}
            max={31}
            inputMode="numeric"
          />
          <TextField
            label="Dia de Vencimento"
            type="number"
            value={String(dueDay)}
            onChange={(v) => setDueDay(parseInt(v, 10) || 1)}
            min={1}
            max={31}
            inputMode="numeric"
          />
        </div>

        <ColorSwatchRow label="Cor do Cartão" colors={cardColors} value={color} onChange={setColor} />

        {errorMsg && (
          <p role="alert" className="text-xs text-negative-strong">
            {errorMsg}
          </p>
        )}
      </form>
    </Modal>
  );
};
