import React, { useState } from 'react';
import { Sparkles, Shield, Wallet, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const OnboardingModal: React.FC = () => {
  const { isFirstRun, loadDemoData, updateSettings } = useFinance();
  const [step, setStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isFirstRun) return null;

  const slides = [
    {
      title: 'Controle seu dinheiro de forma simples.',
      subtitle: 'Sem planilhas complicadas. Tudo no seu controle direto do celular ou computador.',
      icon: Wallet,
      color: '#8B7CFF'
    },
    {
      title: 'Organize contas, cartões e gastos.',
      subtitle: 'Acompanhe limites de cartão, faturas, compras parceladas e orçamentos em tempo real.',
      icon: Sparkles,
      color: '#8B7CFF'
    },
    {
      title: 'Acompanhe suas metas e sonhos.',
      subtitle: 'Defina objetivos para viagens, compras e reserva financeira com cálculo automático de progresso.',
      icon: CheckCircle2,
      color: '#39D98A'
    },
    {
      title: 'Tenha uma visão completa da sua vida financeira.',
      subtitle: '100% offline-first. Seus dados ficam salvos de forma segura no seu próprio dispositivo.',
      icon: Shield,
      color: '#3B82F6'
    }
  ];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#14171D] border border-[#222733] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {step < slides.length ? (
          <div>
            {/* Slide Graphic */}
            <div 
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${slides[step].color}20`, color: slides[step].color }}
            >
              {React.createElement(slides[step].icon, { size: 32 })}
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
              {slides[step].title}
            </h3>
            <p className="text-sm text-[#8E95A3] leading-relaxed mb-8">
              {slides[step].subtitle}
            </p>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-[#8B7CFF]' : 'w-1.5 bg-[#222733]'
                  }`}
                />
              ))}
            </div>

            {/* Next / Skip Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setStep(slides.length)}
                className="py-3 px-4 rounded-xl text-xs font-semibold text-[#8E95A3] hover:text-white transition-colors"
              >
                Pular
              </button>
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3 px-6 rounded-xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-[#8B7CFF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Avançar</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl p-1 bg-black border border-[#222733] flex items-center justify-center shadow-xl shadow-[#8B7CFF]/20">
              <img src="/logo.png" alt="MyFinance" className="w-full h-full object-contain rounded-2xl" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Como você prefere começar?
            </h3>
            <p className="text-xs text-[#8E95A3] mb-8">
              Você pode explorar o app com dados prontos e realistas de demonstração, ou começar sua jornada totalmente do zero.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleStartWithDemo}
                className="w-full py-4 px-6 rounded-2xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white text-sm font-semibold shadow-lg shadow-[#8B7CFF]/20 transition-all flex flex-col items-center disabled:opacity-50"
              >
                <span>Começar com dados de exemplo</span>
                <span className="text-[11px] font-normal text-white/80 mt-0.5">
                  (Recomendado para conhecer todas as telas)
                </span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleStartFromScratch}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1A1F29] hover:bg-[#222733] border border-[#262C3A] text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                Começar do zero
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
