import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare } from 'lucide-react';

function getPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}


interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [platform] = useState<'ios' | 'android' | 'desktop'>(() => getPlatform());
  const [isInstalled] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (platform === 'ios' && (navigator as any).standalone === true))
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

  const showNative = platform !== 'ios' && deferredPrompt;
  const showIOS = platform === 'ios' && !isInstalled && !isDismissed;

  if (isInstalled || isDismissed || (!showNative && !showIOS)) return null;

  return (
    <div
      className="fixed right-4 left-4 md:left-auto md:w-96 z-30 p-4 rounded-2xl bg-surface border border-edge-strong shadow-2xl flex items-start space-x-3.5 animate-slide-up"
      style={{
        bottom: 'calc(var(--bottom-nav-h) + max(12px, env(safe-area-inset-bottom)) + 70px)',
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-info flex items-center justify-center text-on-accent shrink-0 shadow-md">
        <Smartphone size={20} />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <h4 className="text-xs font-bold text-ink leading-tight">Adicione à tela inicial</h4>
          <p className="text-[11px] text-ink-faint mt-0.5 leading-snug">
            {platform === 'ios'
              ? 'Abra no Safari e adicione este app à sua tela inicial.'
              : 'Tenha acesso rápido às suas finanças mesmo offline.'}
          </p>
        </div>

        {showIOS && (
          <div className="space-y-1.5 text-[11px] text-ink leading-snug">
            <div className="flex items-start gap-1.5">
              <span className="font-semibold shrink-0">1.</span>
              <span>Toque no botão Compartilhar <Share2 size={11} className="inline" /> na barra inferior do Safari</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-semibold shrink-0">2.</span>
              <span>Role para baixo e toque em "Adicionar à Tela de Início" <PlusSquare size={11} className="inline" /></span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-semibold shrink-0">3.</span>
              <span>Toque em "Adicionar" no canto superior direito</span>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {showNative && (
            <button
              onClick={handleInstallClick}
              className="py-1.5 px-3 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Download size={13} />
              <span>Instalar app</span>
            </button>
          )}
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
