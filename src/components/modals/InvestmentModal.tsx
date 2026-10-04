import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Investment, InvestmentType } from '../../types';
import { Modal, SelectField, TextAreaField, TextField } from '../ui';

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
    <Modal
      open={isOpen}
      onClose={onClose}
      title={investmentToEdit ? 'Editar Ativo' : 'Novo Investimento'}
      size="md"
      footer={
        <button
          type="submit"
          form="investment-form"
          disabled={isSubmitting}
          className="btn btn-primary btn-block"
        >
          <Check size={16} aria-hidden="true" />
          <span>{isSubmitting ? 'Salvando…' : (investmentToEdit ? 'Salvar Alterações' : 'Adicionar Ativo')}</span>
        </button>
      }
    >
      <form id="investment-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome do Ativo"
          placeholder="Ex: Tesouro Selic 2029, Petrobras, Bitcoin..."
          value={assetName}
          onChange={setAssetName}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Código / Ticker"
            placeholder="Ex: PETR4, BTC"
            value={ticker}
            onChange={setTicker}
          />
          <SelectField
            label="Classe de Ativo"
            value={type}
            onChange={(v) => setType(v as InvestmentType)}
            options={[
              { value: 'fixed_income', label: 'Renda Fixa' },
              { value: 'stocks', label: 'Ações' },
              { value: 'crypto', label: 'Criptomoedas' },
              { value: 'funds', label: 'Fundos Imobiliários' },
              { value: 'etfs', label: 'ETFs' },
              { value: 'other', label: 'Outro' },
            ]}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <TextField label="Qtd" value={quantityStr} onChange={setQuantityStr} placeholder="1" />
          <TextField label="Preço Médio" value={averagePriceStr} onChange={setAveragePriceStr} placeholder="100,00" />
          <TextField label="Preço Atual" value={currentPriceStr} onChange={setCurrentPriceStr} placeholder="105,00" />
        </div>

        <TextField
          label="Instituição / Corretora"
          placeholder="Ex: NuInvest, XP, Inter DTVM, Binance..."
          value={institution}
          onChange={setInstitution}
        />

        <TextAreaField
          label="Observações (opcional)"
          placeholder="Ex: thesis, render, estratégia..."
          value={notes}
          onChange={setNotes}
          rows={3}
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
