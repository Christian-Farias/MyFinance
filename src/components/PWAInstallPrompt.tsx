import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed || !deferredPrompt) return null;

  return (
    <div
      className="fixed right-4 left-4 md:left-auto md:w-96 z-30 p-4 rounded-2xl bg-surface border border-edge-strong shadow-2xl flex items-start space-x-3.5 animate-slide-up"
      style={{
        /* On mobile: above the FAB and bottom nav */
        bottom: 'calc(var(--bottom-nav-h) + max(12px, env(safe-area-inset-bottom)) + 70px)',
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-info flex items-center justify-center text-on-accent shrink-0 shadow-md">
        <Smartphone size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-ink leading-tight">Instale o aplicativo</h4>
        <p className="text-[11px] text-ink-faint mt-0.5 leading-snug">
          Tenha acesso rápido às suas finanças mesmo offline.
        </p>
        <div className="flex items-center space-x-2 mt-2.5">
          <button
            onClick={handleInstallClick}
            className="py-1.5 px-3 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download size={13} />
            <span>Instalar app</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-ink-faint hover:text-ink transition-colors"
          >
            Depois
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="text-ink-faint hover:text-ink p-1"
      >
        <X size={15} />
      </button>
    </div>
  );
};
