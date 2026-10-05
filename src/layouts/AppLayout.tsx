import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { AppTopBar } from '../components/layout/AppTopBar';
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
 * One scroll model at every breakpoint: `.app-shell` is locked to 100dvh and
 * `.app-scroll` is the only thing that scrolls. Previously the lock was
 * mobile-only — desktop scrolled the document and held the sidebar in place
 * with `position: sticky`, so the shell behaved differently depending on window
 * width, and the AI chat had no definite height chain to scroll against.
 *
 * html/body deliberately keep `min-height` rather than a locked height, because
 * `AuthPage` and the `ProtectedRoute` loading state render outside `.app-shell`
 * and must stay scrollable on short viewports.
 */
export const AppLayout: React.FC = () => {
  const location = useLocation();

  /**
   * The AI chat manages its own inner scroll (message list scrolls, composer
   * pinned). That needs the outer scroller out of the way and a full-height
   * column, otherwise the two scrollers fight and the composer drifts off
   * screen. Opt-in per route so every other page keeps normal behaviour.
   */
  const isChatRoute = location.pathname.startsWith('/ia');

  return (
    <ToastProvider>
      <div className="app-shell">
        {/* First focusable element: lets keyboard users bypass the nav. */}
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>

        <Sidebar />

        <div className="app-main">
          <AppTopBar />

          <main
            id="main-content"
            className={`app-scroll ${isChatRoute ? 'app-scroll--locked' : ''}`}
            tabIndex={-1}
          >
            <div className={`page-width ${isChatRoute ? 'page-width--full' : ''}`}>
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