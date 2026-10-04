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
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-4 md:pt-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavigation />

      {/* Global Modals */}
      <NewTransactionModal />
      <QuickActionSheet />
      <TransactionDetailModal />
      <GlobalSearchModal />
      <OnboardingModal />
      <PWAInstallPrompt />
    </div>
  );
};
