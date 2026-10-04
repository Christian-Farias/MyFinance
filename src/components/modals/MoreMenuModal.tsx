import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
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

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { alerts, bills } = useFinance();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue').length;

  if (!isOpen) return null;

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
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-panel w-full sm:max-w-md px-5 sm:px-6 pt-5 sm:pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet-handle md:hidden" />
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222733]">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Mais opções</h3>
            <p className="text-xs text-[#8E95A3]">Todos os módulos e ferramentas</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1F29] text-[#8E95A3] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu items list */}
        <div className="space-y-5 my-4">
          {menuSections.map((sec, idx) => (
            <div key={idx}>
              <span className="text-[11px] font-bold text-[#5F6570] uppercase tracking-wider block mb-2 px-1">
                {sec.title}
              </span>
              <div className="space-y-1.5">
                {sec.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={itemIdx}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0D0F12] hover:bg-[#1A1F29] border border-[#222733] hover:border-[#8B7CFF]/40 transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#1A1F29] group-hover:bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center shrink-0 transition-colors">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-white group-hover:text-[#8B7CFF] transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF5555]/20 text-[#FF5555]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8E95A3] truncate">{item.desc}</p>
                        </div>
                      </div>

                      <ChevronRight size={15} className="text-[#5F6570] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
