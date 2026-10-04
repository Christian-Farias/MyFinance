import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Target,
  LineChart,
  Sliders,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui';

const TONE_ICON = {
  'negative-strong': 'bg-negative-strong/12 text-negative-strong',
  positive: 'bg-positive/12 text-positive',
  info: 'bg-info/12 text-info',
  accent: 'bg-accent/12 text-accent',
  warning: 'bg-warning/12 text-warning',
} as const;

type Tone = keyof typeof TONE_ICON;

export const QuickActionSheet: React.FC = () => {
  const { isQuickActionOpen, setQuickActionOpen, openNewTxModal } = useFinance();
  const navigate = useNavigate();

  const handleSelectAction = (actionFn: () => void) => {
    setQuickActionOpen(false);
    actionFn();
  };

  const actions = [
    {
      title: 'Nova Despesa',
      subtitle: 'Registrar gasto rápido',
      icon: ArrowDownLeft,
      tone: 'negative-strong' as Tone,
      action: () => openNewTxModal('expense'),
    },
    {
      title: 'Nova Receita',
      subtitle: 'Salário, pix ou depósito',
      icon: ArrowUpRight,
      tone: 'positive' as Tone,
      action: () => openNewTxModal('income'),
    },
    {
      title: 'Transferência / Pagar Fatura',
      subtitle: 'Entre contas ou quitar cartão',
      icon: ArrowLeftRight,
      tone: 'info' as Tone,
      action: () => openNewTxModal('transfer'),
    },
    {
      title: 'Nova Conta ou Recorrência',
      subtitle: 'Boletos, aluguel, internet, assinaturas',
      icon: Clock,
      tone: 'accent' as Tone,
      action: () => navigate('/compromissos'),
    },
    {
      title: 'Nova Meta',
      subtitle: 'Guardar dinheiro para sonho',
      icon: Target,
      tone: 'info' as Tone,
      action: () => navigate('/metas'),
    },
    {
      title: 'Novo Investimento',
      subtitle: 'Ações, Renda fixa ou cripto',
      icon: LineChart,
      tone: 'positive' as Tone,
      action: () => navigate('/investimentos'),
    },
    {
      title: 'Novo Orçamento',
      subtitle: 'Definir teto mensal por categoria',
      icon: Sliders,
      tone: 'warning' as Tone,
      action: () => navigate('/orcamentos'),
    },
  ];

  return (
    <Modal
      open={isQuickActionOpen}
      onClose={() => setQuickActionOpen(false)}
      title="Ação Rápida"
      subtitle="O que você deseja registrar agora?"
      variant="sheet"
      size="md"
    >
      <div className="grid grid-cols-1 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              onClick={() => handleSelectAction(act.action)}
              className="flex items-center space-x-3.5 p-3 rounded-2xl bg-field hover:bg-active active:scale-[0.99] border border-edge-strong hover:border-accent/40 transition-all text-left group"
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TONE_ICON[act.tone]}`}
                aria-hidden="true"
              >
                <Icon size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                  {act.title}
                </span>
                <span className="block text-xs text-ink-muted">{act.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};