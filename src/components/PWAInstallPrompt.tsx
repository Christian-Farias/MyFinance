import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

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
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed || !deferredPrompt) return null;

  return (
    <div
      className="fixed right-4 left-4 md:left-auto md:w-96 z-30 p-4 rounded-2xl bg-[#0E0F13] border border-[#22242A] shadow-2xl flex items-start space-x-3.5 animate-slide-up"
      style={{
        /* On mobile: above the FAB and bottom nav */
        bottom: 'calc(var(--bottom-nav-h) + max(12px, env(safe-area-inset-bottom)) + 70px)',
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shrink-0 shadow-md">
        <Smartphone size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white leading-tight">Instale o aplicativo</h4>
        <p className="text-[11px] text-[#8A8F98] mt-0.5 leading-snug">
          Tenha acesso rápido às suas finanças mesmo offline.
        </p>
        <div className="flex items-center space-x-2 mt-2.5">
          <button
            onClick={handleInstallClick}
            className="py-1.5 px-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7c4df0] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download size={13} />
            <span>Instalar app</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-[#8A8F98] hover:text-white transition-colors"
          >
            Depois
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="text-[#8A8F98] hover:text-white p-1"
      >
        <X size={15} />
      </button>
    </div>
  );
};
