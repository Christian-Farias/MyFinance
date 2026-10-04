import React from 'react';
import type { CreditCard } from '../types';
import { formatCurrency } from '../calculations/financialCalculations';
import { Wifi, Plus, Eye } from 'lucide-react';

interface VisualCreditCardProps {
  card: CreditCard;
  currentInvoice?: number;
  onNewExpense?: () => void;
  onViewInvoice?: () => void;
}

export const VisualCreditCard: React.FC<VisualCreditCardProps> = ({
  card,
  currentInvoice = 0,
  onNewExpense,
  onViewInvoice
}) => {
  const used = Math.max(0, card.limit - card.availableLimit);
  const usedPercentage = card.limit > 0 ? Math.min(100, Math.round((used / card.limit) * 100)) : 0;

  return (
    <div className="w-full relative overflow-hidden rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-[#16171E] via-[#111216] to-[#0A0A0D] border border-[#22242A] shadow-2xl transition-all duration-300 hover:border-[#333742]">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center space-x-2 min-w-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shrink-0"
            style={{ backgroundColor: card.color || 'var(--color-accent)', color: '#FFFFFF' }}
          >
            {card.institution.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-ink font-semibold text-sm sm:text-base leading-tight truncate">{card.name}</h4>
            <span className="text-ink-faint text-[11px] sm:text-xs font-mono tracking-widest">•••• {card.lastDigits || '0000'}</span>
          </div>
        </div>

        {/* Brand & Contactless */}
        <div className="flex items-center space-x-2 shrink-0">
          <Wifi size={16} className="text-ink-faint rotate-90" />
          <div className="flex -space-x-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EB001B] opacity-90" />
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-warning opacity-90" />
          </div>
        </div>
      </div>

      {/* Invoice Amount */}
      <div className="mb-4 sm:mb-5">
        <span className="text-ink-faint text-[11px] sm:text-xs font-medium uppercase tracking-wider block mb-1">Fatura atual</span>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          {formatCurrency(currentInvoice || used)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-faint">Limite utilizado</span>
          <span className="text-ink font-semibold">{usedPercentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#1C1E24] overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${usedPercentage}%`,
              backgroundColor: usedPercentage > 90 ? 'var(--color-negative)' : usedPercentage > 70 ? 'var(--color-warning)' : (card.color || 'var(--color-accent)')
            }}
          />
        </div>
      </div>

      {/* Limits Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-[#1F2128] text-xs mb-4 sm:mb-5">
        <div>
          <span className="text-ink-faint block mb-0.5">Limite total</span>
          <span className="text-ink font-medium">{formatCurrency(card.limit)}</span>
        </div>
        <div>
          <span className="text-ink-faint block mb-0.5">Disponível</span>
          <span className="text-positive font-medium">{formatCurrency(card.availableLimit)}</span>
        </div>
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-[#1F2128] text-xs">
        <div>
          <span className="text-ink-faint block mb-0.5">Fecha em</span>
          <span className="text-ink font-medium">{String(card.closingDay).padStart(2, '0')} do mês</span>
        </div>
        <div>
          <span className="text-ink-faint block mb-0.5">Vence em</span>
          <span className="text-ink font-medium">{String(card.dueDay).padStart(2, '0')} do mês</span>
        </div>
      </div>

      {/* Quick Action buttons */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[#1F2128] flex items-center space-x-2">
        {onNewExpense && (
          <button
            onClick={onNewExpense}
            className="flex-1 py-2 px-3 rounded-xl bg-[#1C1E24] hover:bg-[#252830] text-ink text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Comprar no cartão</span>
          </button>
        )}
        {onViewInvoice && (
          <button
            onClick={onViewInvoice}
            className="py-2 px-3 rounded-xl bg-[#1C1E24] hover:bg-[#252830] text-ink-faint hover:text-ink text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Eye size={14} />
            <span>Fatura</span>
          </button>
        )}
      </div>
    </div>
  );
};
