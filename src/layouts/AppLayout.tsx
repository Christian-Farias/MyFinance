import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNavigation } from '../components/BottomNavigation';
import { NewTransactionModal } from '../components/modals/NewTransactionModal';
import { QuickActionSheet } from '../components/modals/QuickActionSheet';
import { TransactionDetailModal } from '../components/modals/TransactionDetailModal';
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';
import { OnboardingModal } from '../components/modals/OnboardingModal';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

export const AppLayout: React.FC = () => {
  return (
    <div
      className="bg-[#050505] text-[#F5F5F5] flex flex-col md:flex-row"
      style={{ minHeight: '100dvh', height: '100dvh', maxHeight: '100dvh' }}
    >
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <Sidebar />

      {/* ── Main Content Area ── */}
      <main
        className="flex-1 min-w-0 w-full flex flex-col min-h-0 overflow-hidden"
      >
        {/* Safe area top padding — pushes content below Dynamic Island/notch */}
        <div
          className="md:hidden shrink-0"
          style={{ height: 'max(16px, env(safe-area-inset-top))' }}
        />

        {/* Scrollable content area — each page controls its own layout */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          id="page-scroll-container"
        >
          {/* Width constraint applied here, not on main */}
          <div className="max-w-2xl mx-auto md:max-w-4xl px-4 sm:px-5 md:px-8 md:pt-6 h-full flex flex-col">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <BottomNavigation />

      {/* ── Global Modals (z-index 60+) ── */}
      <NewTransactionModal />
      <QuickActionSheet />
      <TransactionDetailModal />
      <GlobalSearchModal />
      <OnboardingModal />
      <PWAInstallPrompt />
    </div>
  );
};
