import React, { useState, useRef } from 'react';
import {
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  Lock,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { backupService } from '../services/backupService';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, loadDemoData, resetAllData } = useFinance();
  const [confirmClear, setConfirmClear] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    try {
      await backupService.downloadBackupFile();
      setSuccessMsg('Backup exportado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const text = await file.text();
      const success = await backupService.importData(text);
      if (success) {
        setSuccessMsg('Backup restaurado com sucesso! Atualizando tela...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('Arquivo de backup inválido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar arquivo de backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsProcessing(true);
    await loadDemoData();
    setIsProcessing(false);
    setSuccessMsg('Dados de demonstração carregados com sucesso!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetData = async () => {
    setIsProcessing(true);
    await resetAllData();
    setIsProcessing(false);
    setConfirmClear(false);
    setSuccessMsg('Todos os dados foram excluídos.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-24 px-1">

      {/* ── HEADER ── */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">Configurações</h1>
      </div>

      {/* ── APP ABOUT & LOGO ── */}
      <div className="card p-4 flex items-center space-x-4">
        <img 
          src="/logo.png" 
          alt="MyFinance" 
          className="w-14 h-14 rounded-2xl object-contain bg-black border border-[#222733] shadow-md shrink-0" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight">MyFinance</h3>
            <span className="pill pill-purple text-[10px]">PWA v2.0</span>
          </div>
          <p className="text-xs text-[#8E95A3] mt-0.5">Gestão financeira pessoal moderna e offline-first.</p>
        </div>
      </div>

      {/* ── SUCCESS MESSAGE ── */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#39D98A]/8 border border-[#39D98A]/20 text-[#39D98A] text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── USER PROFILE ── */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-full bg-[#121419] border border-[#1D2026] flex items-center justify-center text-[#8B7CFF] font-bold text-base">
            {(settings.name || 'US').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F5F5F5]">{settings.name || 'Usuário'}</h4>
            <p className="label-xs">{settings.email || 'seu@email.com'}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#5F6570]" />
      </div>

      {/* ── PREFERENCES ── */}
      <div className="card overflow-hidden divide-y divide-[#1D2026]">
        {[
          { icon: User,   label: 'Conta' },
          { icon: Bell,   label: 'Notificações' },
          { icon: Moon,   label: 'Aparência',   value: 'Escuro' },
          { icon: Globe,  label: 'Idioma',      value: 'Português' },
          { icon: Shield, label: 'Segurança' },
          { icon: Lock,   label: 'Privacidade' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between p-4 hover:bg-[#121419] transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Icon size={16} className="text-[#8B919B]" />
              <span className="text-xs font-semibold text-[#F5F5F5]">{label}</span>
            </div>
            <div className="flex items-center space-x-2">
              {value && <span className="text-xs text-[#8B919B]">{value}</span>}
              <ChevronRight size={14} className="text-[#5F6570]" />
            </div>
          </div>
        ))}
      </div>

      {/* ── DATA MANAGEMENT ── */}
      <div>
        <p className="label-section mb-3 px-0.5">Dados</p>
        <div className="card overflow-hidden divide-y divide-[#1D2026]">
          <div
            onClick={handleExportBackup}
            className="flex items-center justify-between p-4 hover:bg-[#121419] transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Download size={16} className="text-[#8B7CFF]" />
              <span className="text-xs font-semibold text-[#F5F5F5]">Exportar dados (Backup JSON)</span>
            </div>
            <ChevronRight size={14} className="text-[#5F6570]" />
          </div>

          <div
            onClick={() => backupInputRef.current?.click()}
            className="flex items-center justify-between p-4 hover:bg-[#121419] transition-colors cursor-pointer"
          >
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <div className="flex items-center space-x-3">
              <Upload size={16} className="text-[#3B82F6]" />
              <span className="text-xs font-semibold text-[#F5F5F5]">Restaurar backup JSON</span>
            </div>
            <ChevronRight size={14} className="text-[#5F6570]" />
          </div>

          <div
            onClick={handleSeedDemo}
            className="flex items-center justify-between p-4 hover:bg-[#121419] transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Sparkles size={16} className="text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#F5F5F5]">Carregar dados de exemplo</span>
            </div>
            <ChevronRight size={14} className="text-[#5F6570]" />
          </div>
        </div>
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="card p-4 border-[#FF5C5C]/15">
        {confirmClear ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-[#FF5C5C] text-xs font-bold">
              <AlertTriangle size={16} />
              <span>Tem certeza que deseja apagar todos os dados?</span>
            </div>
            <p className="text-xs text-[#8B919B] leading-relaxed">
              Esta ação excluirá todas as transações, contas, cartões e orçamentos do banco local do seu dispositivo.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleResetData}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FF5C5C] hover:bg-[#e04848] text-white text-xs font-bold transition-colors"
              >
                {isProcessing ? 'Apagando...' : 'Sim, apagar tudo'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="py-2.5 px-4 rounded-xl bg-[#121419] text-[#8B919B] text-xs font-semibold hover:text-[#F5F5F5] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full flex items-center justify-between text-[#FF5C5C]/70 hover:text-[#FF5C5C] text-xs font-semibold transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Trash2 size={16} />
              <span>Excluir todos os dados</span>
            </div>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
