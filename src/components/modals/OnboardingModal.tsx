import React, { useState } from 'react';
import { Sparkles, Shield, Wallet, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui';

const TONE = {
  accent: 'bg-accent/12 text-accent',
  positive: 'bg-positive/12 text-positive',
  info: 'bg-info/12 text-info',
} as const;

const SLIDES = [
  {
    title: 'Controle seu dinheiro de forma simples.',
    subtitle: 'Sem planilhas complicadas. Tudo no seu controle direto do celular ou computador.',
    icon: Wallet,
    tone: 'accent' as const,
  },
  {
    title: 'Organize contas, cartões e gastos.',
    subtitle: 'Acompanhe limites de cartão, faturas, compras parceladas e orçamentos em tempo real.',
    icon: Sparkles,
    tone: 'accent' as const,
  },
  {
    title: 'Acompanhe suas metas e sonhos.',
    subtitle: 'Defina objetivos para viagens, compras e reserva financeira com cálculo automático de progresso.',
    icon: CheckCircle2,
    tone: 'positive' as const,
  },
  {
    title: 'Tenha uma visão completa da sua vida financeira.',
    subtitle: '100% offline-first. Seus dados ficam salvos de forma segura no seu próprio dispositivo.',
    icon: Shield,
    tone: 'info' as const,
  },
];

export const OnboardingModal: React.FC = () => {
  const { isFirstRun, loadDemoData, updateSettings } = useFinance();
  const [step, setStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleStartWithDemo = async () => {
    setIsProcessing(true);
    await loadDemoData();
    setIsProcessing(false);
  };

  const handleStartFromScratch = async () => {
    setIsProcessing(true);
    await updateSettings({ hasSeenOnboarding: true, hasLoadedDemoData: false });
    setIsProcessing(false);
  };

  const isChoiceStep = step >= SLIDES.length;
  const current = SLIDES[step];
  const Icon = current?.icon;

  return (
    <Modal
      open={isFirstRun}
      onClose={() => {}}
      title="Bem-vindo ao MyFinance"
      hideTitle
      closeOnBackdrop={false}
      closeOnEscape={false}
      showCloseButton={false}
      size="md"
    >
      {!isChoiceStep && current && Icon ? (
        <div className="text-center">
          <span
            className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg ${TONE[current.tone]}`}
            aria-hidden="true"
          >
            <Icon size={32} />
          </span>

          <h2 className="text-xl font-bold text-ink mb-3 tracking-tight">{current.title}</h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-8">{current.subtitle}</p>

          <div
            className="flex items-center justify-center space-x-2 mb-8"
            role="group"
            aria-label={`Passo ${step + 1} de ${SLIDES.length}`}
          >
            {SLIDES.map((slide, i) => (
              <span
                key={slide.title}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-accent' : 'w-1.5 bg-active'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setStep(SLIDES.length)}
              className="py-3 px-4 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Pular
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              data-autofocus
              className="btn btn-primary flex-1"
            >
              <span>Avançar</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl p-1 flex items-center justify-center">
            <img src="/logo.png" alt="MyFinance" className="w-full h-full object-contain rounded-2xl" />
          </div>

          <h2 className="text-2xl font-bold text-ink mb-2 tracking-tight">Como você prefere começar?</h2>
          <p className="text-xs text-ink-muted mb-8">
            Você pode explorar o app com dados prontos e realistas de demonstração, ou começar sua
            jornada totalmente do zero.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartWithDemo}
              className="btn btn-primary w-full flex-col shadow-lg"
            >
              <span>Começar com dados de exemplo</span>
              <span className="text-xs font-normal text-on-accent/80 mt-0.5">
                (Recomendado para conhecer todas as telas)
              </span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartFromScratch}
              className="w-full py-3.5 px-6 rounded-2xl bg-field hover:bg-active border border-edge-strong text-ink text-xs font-semibold transition-all disabled:opacity-50"
            >
              Começar do zero
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};