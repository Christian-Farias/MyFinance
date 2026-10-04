import React, { useState } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { CreditCard as ICreditCard, CardBrand } from '../../types';

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
  const [color, setColor] = useState(cardToEdit?.color || '#8B7CFF');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

  const cardColors = ['#8B7CFF', '#39D98A', '#3B82F6', '#FFB74D', '#EC4899', '#8A05BE', '#1E293B'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-[#14171D] border border-[#222733] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {cardToEdit ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
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
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Nome do Cartão</label>
            <input
              type="text"
              placeholder="Ex: Nubank Ultravioleta, Inter Black..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Banco / Emissor</label>
              <input
                type="text"
                placeholder="Ex: Nubank"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Bandeira</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as CardBrand)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="other">Outra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Limite Total (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="3000,00"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-medium placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Últimos 4 dígitos</label>
              <input
                type="text"
                maxLength={4}
                placeholder="4821"
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white font-mono placeholder-[#5F6570]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Dia de Fechamento</label>
              <input
                type="number"
                min={1}
                max={31}
                value={closingDay}
                onChange={(e) => setClosingDay(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Dia de Vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1.5">Cor do Cartão</label>
            <div className="flex items-center space-x-2">
              {cardColors.map(c => (
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
              <span>{isSubmitting ? 'Salvando...' : (cardToEdit ? 'Atualizar Cartão' : 'Criar Cartão')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
