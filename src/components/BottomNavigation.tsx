import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, Sparkles, Menu, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MoreMenuModal } from './modals/MoreMenuModal';

export const BottomNavigation: React.FC = () => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { setQuickActionOpen } = useFinance();

  const handleQuickAction = () => {
    setQuickActionOpen(true);
  };

  const mainNav = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
  ];

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="bottom-nav bottom-nav-premium md:hidden"
      >
        <div className="bottom-nav-inner bottom-nav-inner--five">
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
                      strokeWidth={2}
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
            onClick={handleQuickAction}
            aria-label="Nova transação"
            className="bottom-nav-fab bottom-nav-fab-premium"
          >
            <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <NavLink
            to="/ia"
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Sparkles
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="bottom-nav-label">IA</span>
              </>
            )}
          </NavLink>

          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(true)}
            aria-label="Mais opções"
            aria-haspopup="dialog"
            className="bottom-nav-item"
          >
            <Menu size={20} strokeWidth={2} aria-hidden="true" />
            <span className="bottom-nav-label">Mais</span>
          </button>
        </div>
      </nav>

      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />
    </>
  );
};
