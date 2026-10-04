import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Investment, InvestmentType } from '../../types';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentToEdit?: Investment;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  investmentToEdit
}) => {
  const { addInvestment, updateInvestment } = useFinance();

  const [assetName, setAssetName] = useState(investmentToEdit?.assetName || '');
  const [ticker, setTicker] = useState(investmentToEdit?.ticker || '');
  const [type, setType] = useState<InvestmentType>(investmentToEdit?.type || 'fixed_income');
  const [quantityStr, setQuantityStr] = useState(investmentToEdit ? investmentToEdit.quantity.toString() : '1');
  const [averagePriceStr, setAveragePriceStr] = useState(investmentToEdit ? investmentToEdit.averagePrice.toString() : '');
  const [currentPriceStr, setCurrentPriceStr] = useState(investmentToEdit ? investmentToEdit.currentPrice.toString() : '');
  const [institution, setInstitution] = useState(investmentToEdit?.institution || '');
  const [notes, setNotes] = useState(investmentToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      setErrorMsg('Informe o nome do ativo.');
      return;
    }
    const quantity = parseFloat(quantityStr.replace(',', '.')) || 0;
    const avgPrice = parseFloat(averagePriceStr.replace(',', '.')) || 0;
    const curPrice = parseFloat(currentPriceStr.replace(',', '.')) || avgPrice;

    if (quantity <= 0 || avgPrice <= 0) {
      setErrorMsg('Informe quantidade e preço válidos.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (investmentToEdit) {
        await updateInvestment({
          ...investmentToEdit,
          assetName: assetName.trim(),
          ticker: ticker.trim().toUpperCase() || undefined,
          type,
          quantity,
          averagePrice: avgPrice,
          currentPrice: curPrice,
          institution: institution.trim() || 'Corretora',
          notes: notes.trim() || undefined
        });
      } else {
        await addInvestment({
          assetName: assetName.trim(),
          ticker: ticker.trim().toUpperCase() || undefined,
          type,
          quantity,
          averagePrice: avgPrice,
          currentPrice: curPrice,
          institution: institution.trim() || 'Corretora',
          date: new Date().toISOString().split('T')[0],
          notes: notes.trim() || undefined
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar ativo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-md bg-[#14171D] border border-[#222733] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <h3 className="text-base font-bold text-white">
            {investmentToEdit ? 'Editar Ativo' : 'Novo Investimento'}
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
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Nome do Ativo</label>
            <input
              type="text"
              placeholder="Ex: Tesouro Selic 2029, Petrobras, Bitcoin..."
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] focus:border-[#8B7CFF] text-sm text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Código / Ticker</label>
              <input
                type="text"
                placeholder="Ex: PETR4, BTC"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white uppercase font-mono placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Classe de Ativo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvestmentType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white"
              >
                <option value="fixed_income">Renda Fixa</option>
                <option value="stocks">Ações</option>
                <option value="crypto">Criptomoedas</option>
                <option value="funds">Fundos Imobiliários</option>
                <option value="etfs">ETFs</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Qtd</label>
              <input
                type="number"
                step="any"
                placeholder="1"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Preço Médio</label>
              <input
                type="number"
                step="0.01"
                placeholder="100,00"
                value={averagePriceStr}
                onChange={(e) => setAveragePriceStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E95A3] mb-1">Preço Atual</label>
              <input
                type="number"
                step="0.01"
                placeholder="105,00"
                value={currentPriceStr}
                onChange={(e) => setCurrentPriceStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E95A3] mb-1">Instituição / Corretora</label>
            <input
              type="text"
              placeholder="Ex: NuInvest, XP, Inter DTVM, Binance..."
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1A1F29] border border-[#262C3A] text-xs text-white placeholder-[#5F6570]"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-semibold text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Salvando...' : (investmentToEdit ? 'Salvar Alterações' : 'Adicionar Ativo')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
