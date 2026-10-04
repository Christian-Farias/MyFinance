import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, Sparkles, CreditCard, Menu, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MoreMenuModal } from './modals/MoreMenuModal';

export const BottomNavigation: React.FC = () => {
  const { setQuickActionOpen } = useFinance();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainNav = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
    { to: '/ia', label: 'IA', icon: Sparkles },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  ];

  return (
    <>
      {/* Discrete Floating Add Button */}
      <button
        onClick={() => setQuickActionOpen(true)}
        aria-label="Nova Operação Rápida"
        className="md:hidden fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-[#8B7CFF] text-white shadow-lg shadow-[#8B7CFF]/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Simplified Mobile Bottom Bar */}
      <nav 
        aria-label="Navegação inferior mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-nav safe-bottom select-none"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full py-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'text-[#F5F5F5]'
                      : 'text-[#8B919B] hover:text-[#D1D5DB]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.3 : 1.8}
                        className={`transition-transform duration-200 ${isActive ? 'scale-105 text-[#8B7CFF]' : ''}`}
                      />
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8B7CFF]" />
                      )}
                    </div>
                    <span className={`mt-1 text-[11px] ${isActive ? 'text-white font-semibold' : 'text-[#8B919B]'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Item 5: 'Mais' opens drawer */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full py-1 text-xs font-medium text-[#8B919B] hover:text-white transition-all active:scale-95"
          >
            <Menu size={19} strokeWidth={1.8} />
            <span className="mt-1 text-[11px] text-[#8B919B]">Mais</span>
          </button>
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />
    </>
  );
};
