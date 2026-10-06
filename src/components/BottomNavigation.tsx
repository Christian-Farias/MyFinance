import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, Sparkles, Menu } from 'lucide-react';
import { MoreMenuModal } from './modals/MoreMenuModal';

/**
 * Mobile navigation.
 *
 * Was six touch targets in the bottom strip: four tabs, a "Mais" button and a
 * floating FAB. On a 360px screen that is crowded, and the FAB also covered
 * the chat composer (it needed its own route check to hide itself).
 *
 * Now four equal slots. The FAB's job — starting a quick entry — moved into
 * the "Mais" sheet, which is the one place that already collects actions that
 * do not warrant a permanent slot.
 *
 * The tab label is "IA" rather than "Neguin" so it matches the icon and the
 * other three labels; the assistant is still named Neguin in the chat header.
 *
 * Slot widths come from `.bottom-nav-inner` (an equal `grid-template-columns`),
 * not `flex-1` + `justify-around`, which sized each tab by its label and made
 * "IA" visibly narrower than "Cartões".
 */
export const BottomNavigation: React.FC = () => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainNav = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
    { to: '/ia', label: 'IA', icon: Sparkles },
  ];

  return (
    <>
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
                      /* 1.75 idle / 2 active. Thinner than the previous
                         1.8/2.3 pair: a 20px glyph at 2.3 reads heavy next
                         to a 10px label, and the state is carried by colour
                         plus label weight as well as by this stroke. */
                      strokeWidth={isActive ? 2 : 1.75}
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
            <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
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