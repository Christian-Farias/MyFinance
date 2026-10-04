import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNavigation } from '../components/BottomNavigation';
import { NewTransactionModal } from '../components/modals/NewTransactionModal';
import { QuickActionSheet } from '../components/modals/QuickActionSheet';
import { TransactionDetailModal } from '../components/modals/TransactionDetailModal';
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';
import { OnboardingModal } from '../components/modals/OnboardingModal';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { ToastProvider, LoadingState } from '../components/ui';

/**
 * App shell.
 *
 * The viewport is locked to 100dvh and the inner container scrolls, which is
 * correct for a mobile app but wrong on desktop: the sidebar scrolled with the
 * page and the browser chrome never resized the layout. The lock is now
 * mobile-only, and desktop scrolls the document normally.
 */
export const AppLayout: React.FC = () => {
  return (
    <ToastProvider>
      <div className="app-shell">
        {/* First focusable element: lets keyboard users bypass the nav. */}
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>

        <Sidebar />

        <div className="app-main">
          <main id="main-content" className="app-scroll" tabIndex={-1}>
            <div className="page-width">
              {/* Routes are lazy; the fallback is the same skeleton the
                  pages use while IndexedDB answers. */}
              <Suspense fallback={<LoadingState rows={4} label="Abrindo página" />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>

        <BottomNavigation />

        <NewTransactionModal />
        <QuickActionSheet />
        <TransactionDetailModal />
        <GlobalSearchModal />
        <OnboardingModal />
        <PWAInstallPrompt />
      </div>
    </ToastProvider>
  );
};