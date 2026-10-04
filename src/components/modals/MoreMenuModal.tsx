import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, 
  ArrowLeftRight, 
  Sliders, 
  Target, 
  LineChart, 
  Bell, 
  Upload, 
  Settings, 
  ChevronRight,
  Clock,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Bot
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { alerts, bills } = useFinance();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue').length;

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const menuSections = [
    {
      title: 'Planejamento & Compromissos',
      items: [
        { 
          label: 'Compromissos', 
          path: '/compromissos', 
          icon: Clock, 
          desc: 'Contas a pagar, receber e assinaturas',
          badge: pendingBills > 0 ? `${pendingBills} conta${pendingBills > 1 ? 's' : ''}` : undefined
        },
        { label: 'Calendário Financeiro', path: '/calendario', icon: Calendar, desc: 'Visão cronológica dos vencimentos' },
        { label: 'Fluxo de Caixa', path: '/fluxo-caixa', icon: TrendingUp, desc: 'Projeção de saldo para 30 dias' },
        { label: 'Fechamento Mensal', path: '/fechamento', icon: FileSpreadsheet, desc: 'Histórico e diagnóstico mensal' },
      ]
    },
    {
      title: 'Organização',
      items: [
        { label: 'Contas', path: '/contas', icon: Wallet, desc: 'Bancos, carteiras e saldos' },
        { label: 'Transações', path: '/transacoes', icon: ArrowLeftRight, desc: 'Histórico completo de lançamentos' },
        { label: 'Orçamentos', path: '/orcamentos', icon: Sliders, desc: 'Limites por categoria' },
        { label: 'Metas', path: '/metas', icon: Target, desc: 'Acompanhe seus objetivos' },
        { label: 'Investimentos', path: '/investimentos', icon: LineChart, desc: 'Renda fixa, ações e carteira' },
      ]
    },
    {
      title: 'Inteligência & Gestão',
      items: [
        { 
          label: 'O que mudou (Alertas)', 
          path: '/alertas', 
          icon: Bell, 
          desc: 'Avisos e fatos relevantes',
          badge: unreadAlerts > 0 ? `${unreadAlerts} novo${unreadAlerts > 1 ? 's' : ''}` : undefined 
        },
        { label: 'Importar Extrato', path: '/importar', icon: Upload, desc: 'Leitura de CSV ou OFX' },
        { label: 'Configurações', path: '/configuracoes', icon: Settings, desc: 'Perfil, backups e segurança' },
      ]
    }
  ];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Mais opções"
      subtitle="Todos os módulos e ferramentas"
      variant="sheet"
      size="md"
    >
      <div className="space-y-5">
        {menuSections.map((sec) => (
          <div key={sec.title}>
            <h3 className="text-[11px] font-bold text-ink-faint uppercase tracking-wider block mb-2 px-1">
              {sec.title}
            </h3>
            <div className="space-y-1.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface hover:bg-field border border-active hover:border-accent/40 transition-all text-left group"
                  >
                    <span className="flex items-center space-x-3.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-field group-hover:bg-accent/15 text-accent flex items-center justify-center shrink-0 transition-colors">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-ink group-hover:text-accent transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-negative-strong/20 text-negative-strong">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-ink-muted truncate">{item.desc}</span>
                      </span>
                    </span>

                    <ChevronRight
                      size={15}
                      aria-hidden="true"
                      className="text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
