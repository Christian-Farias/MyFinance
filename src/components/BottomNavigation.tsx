import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PieChart, Sparkles, CreditCard, Menu, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MoreMenuModal } from './modals/MoreMenuModal';

/**
 * Mobile navigation.
 *
 * The five tabs were laid out with `justify-around` and `flex-1`, which gave
 * each item a width driven by its label length — "IA" was visibly narrower
 * than "Cartões". Fixed slots plus an accent indicator is what the iOS and
 * Material patterns both converge on.
 */

export const BottomNavigation: React.FC = () => {
  const { setQuickActionOpen } = useFinance();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const location = useLocation();

  // Hide FAB on IA chat page to prevent covering the input box and send button
  const isAIPage = location.pathname.startsWith('/ia');

  const mainNav = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
    { to: '/ia', label: 'Neguin', icon: Sparkles },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  ];

  return (
    <>
      {!isAIPage && (
        <button
          type="button"
          onClick={() => setQuickActionOpen(true)}
          aria-label="Nova Operação Rápida"
          className="fab md:hidden"
        >
          <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}

      <nav
        aria-label="Navegação principal"
        className="bottom-nav md:hidden"
      >
        <div className="bottom-nav-inner">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.3 : 1.8}
                      aria-hidden="true"
                    />
                    <span className="bottom-nav-label">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(true)}
            aria-label="Mais opções"
            aria-haspopup="dialog"
            className="bottom-nav-item"
          >
            <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
            <span className="bottom-nav-label">Mais</span>
          </button>
        </div>
      </nav>

      <MoreMenuModal isOpen={isMoreMenuOpen} onClose={() => setIsMoreMenuOpen(false)} />
    </>
  );
};