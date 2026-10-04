import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PieChart, Sparkles, CreditCard, Menu, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { MoreMenuModal } from './modals/MoreMenuModal';

export const BottomNavigation: React.FC = () => {
  const { setQuickActionOpen } = useFinance();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const location = useLocation();

  // Hide FAB on IA chat page to prevent covering the input box and send button
  const isAIPage = location.pathname === '/ia';

  const mainNav = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/gastos', label: 'Gastos', icon: PieChart },
    { to: '/ia', label: 'IA', icon: Sparkles },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  ];

  return (
    <>
      {/*
        ── FAB (Floating Action Button) ─────────────────────────────────
        Positioned above the bottom nav using CSS custom properties:
        bottom = nav height + safe area + gap
        This is the SINGLE source of truth for FAB positioning.
      */}
      {!isAIPage && (
        <button
          onClick={() => setQuickActionOpen(true)}
          aria-label="Nova Operação Rápida"
          className="md:hidden fixed z-30 w-13 h-13 rounded-full bg-[#8B7CFF] text-white flex items-center justify-center shadow-lg shadow-[#8B7CFF]/25 hover:scale-105 active:scale-95 transition-transform duration-200"
          style={{
            right: 'max(16px, env(safe-area-inset-right))',
            bottom: 'calc(var(--bottom-nav-h) + max(12px, env(safe-area-inset-bottom)) + 12px)',
            width: '52px',
            height: '52px',
            /* Ensure 44px+ touch target */
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {/*
        ── Bottom Navigation Bar ────────────────────────────────────────
        Fixed at bottom. Height = var(--bottom-nav-h) + safe area padding.
        Content (icons + labels) stay within the --bottom-nav-h zone.
        The safe area padding is ADDITIONAL space below the content.
      */}
      <nav
        aria-label="Navegação inferior mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav select-none"
        style={{
          /* Ensure nav doesn't overlap system gesture area */
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div
          className="flex items-center justify-around px-1"
          style={{ height: 'var(--bottom-nav-h)' }}
        >
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all ${
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
                        size={20}
                        strokeWidth={isActive ? 2.3 : 1.8}
                        className={`transition-transform duration-200 ${
                          isActive ? 'scale-105 text-[#8B7CFF]' : ''
                        }`}
                      />
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8B7CFF]" />
                      )}
                    </div>
                    <span
                      className={`mt-1 text-[10px] leading-none ${
                        isActive ? 'text-white font-semibold' : 'text-[#8B919B]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* ── "Mais" — opens the extended menu drawer ── */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            aria-label="Mais opções"
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[#8B919B] hover:text-white transition-all active:scale-95"
          >
            <Menu size={20} strokeWidth={1.8} />
            <span className="mt-1 text-[10px] leading-none text-[#8B919B]">Mais</span>
          </button>
        </div>
      </nav>

      {/* ── More Menu Bottom Sheet (z-index > bottom nav) ── */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />
    </>
  );
};
