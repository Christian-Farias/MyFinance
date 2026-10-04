import React from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Target, 
  CreditCard, 
  LineChart, 
  Sliders, 
  Clock, 
  Repeat,
  Tv
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';

export const QuickActionSheet: React.FC = () => {
  const { isQuickActionOpen, setQuickActionOpen, openNewTxModal } = useFinance();
  const navigate = useNavigate();

  if (!isQuickActionOpen) return null;

  const actions = [
    {
      title: 'Nova Despesa',
      subtitle: 'Registrar gasto rápido',
      icon: ArrowDownLeft,
      color: '#FF5555',
      bgColor: '#FF555520',
      action: () => openNewTxModal('expense')
    },
    {
      title: 'Nova Receita',
      subtitle: 'Salário, pix ou depósito',
      icon: ArrowUpRight,
      color: '#39D98A',
      bgColor: '#39D98A20',
      action: () => openNewTxModal('income')
    },
    {
      title: 'Transferência / Pagar Fatura',
      subtitle: 'Entre contas ou quitar cartão',
      icon: ArrowLeftRight,
      color: '#3B82F6',
      bgColor: '#3B82F620',
      action: () => openNewTxModal('transfer')
    },
    {
      title: 'Nova Conta ou Recorrência',
      subtitle: 'Boletos, aluguel, internet, assinaturas',
      icon: Clock,
      color: '#8B7CFF',
      bgColor: '#8B7CFF20',
      action: () => {
        setQuickActionOpen(false);
        navigate('/compromissos');
      }
    },
    {
      title: 'Nova Meta',
      subtitle: 'Guardar dinheiro para sonho',
      icon: Target,
      color: '#38BDF8',
      bgColor: '#38BDF820',
      action: () => {
        setQuickActionOpen(false);
        navigate('/metas');
      }
    },
    {
      title: 'Novo Investimento',
      subtitle: 'Ações, Renda fixa ou cripto',
      icon: LineChart,
      color: '#39D98A',
      bgColor: '#39D98A20',
      action: () => {
        setQuickActionOpen(false);
        navigate('/investimentos');
      }
    },
    {
      title: 'Novo Orçamento',
      subtitle: 'Definir teto mensal por categoria',
      icon: Sliders,
      color: '#FFB74D',
      bgColor: '#FFB74D20',
      action: () => {
        setQuickActionOpen(false);
        navigate('/orcamentos');
      }
    }
  ];

  return (
    <div
      className="modal-overlay"
      onClick={() => setQuickActionOpen(false)}
    >
      <div
        className="modal-panel w-full sm:max-w-md px-6 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet-handle md:hidden" />
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <div>
            <h3 className="text-base font-bold text-white">Ação Rápida</h3>
            <p className="text-xs text-[#8E95A3]">O que você deseja registrar agora?</p>
          </div>
          <button
            onClick={() => setQuickActionOpen(false)}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 my-4">
          {actions.map((act, index) => {
            const Icon = act.icon;
            return (
              <button
                key={index}
                onClick={act.action}
                className="flex items-center space-x-3.5 p-3 rounded-2xl bg-[#1A1F29] hover:bg-[#222733] active:scale-[0.99] border border-[#262C3A] hover:border-[#8B7CFF]/40 transition-all text-left group"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: act.bgColor, color: act.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#8B7CFF] transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#8E95A3]">{act.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
