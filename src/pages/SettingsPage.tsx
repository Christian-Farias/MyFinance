import React, { useState, useRef } from 'react';
import {
  Info,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { ErrorState, LoadingState, useToast } from '../components/ui';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { useAuth } from '../context/AuthContext';
import { backupService } from '../services/backupService';

export const SettingsPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { settings, updateSettings, loadDemoData, resetAllData } = useFinance();
  const { userEmail, userName, signOut } = useAuth();
  const [confirmClear, setConfirmClear] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const backupInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [profileName, setProfileName] = useState(settings.name);
  const [profileEmail, setProfileEmail] = useState(settings.email);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    const name = profileName.trim();
    const email = profileEmail.trim();
    if (!name) {
      toast.error('O nome não pode ficar vazio.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateSettings({ name, email });
      toast.success('Perfil atualizado.');
    } catch {
      toast.error('Não foi possível salvar o perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await backupService.downloadBackupFile();
      toast.success('Backup exportado com sucesso!');
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
        toast.success('Backup restaurado. Atualizando…');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error('Arquivo de backup inválido.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar arquivo de backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsProcessing(true);
    await loadDemoData();
    setIsProcessing(false);
    toast.success('Dados de demonstração carregados com sucesso!');
  };

  const handleResetData = async () => {
    setIsProcessing(true);
    await resetAllData();
    setIsProcessing(false);
    setConfirmClear(false);
    toast.success('Todos os dados foram excluídos.');
  };

  /* Sem esta guarda a página desenhava o estado vazio antes de o IndexedDB
     responder — e uma falha de leitura ficava idêntica a "não há dados". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Configurações</h1>
      </div>

      {/* ── APP ABOUT & LOGO ── */}
      <div className="card p-4 flex items-center space-x-4">
        <img 
          src="/logo.png" 
          alt="MyFinance" 
          className="w-14 h-14 rounded-2xl object-contain shadow-md shrink-0" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-ink tracking-tight">MyFinance</h3>
            <span className="pill pill-accent text-[11px]">PWA v2.0</span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">Gestão financeira pessoal moderna e offline-first.</p>
        </div>
      </div>

      {/* ── SUCCESS MESSAGE ── */}

      {/* ── USER PROFILE ── */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-full bg-surface-raised border border-edge flex items-center justify-center text-accent-text font-bold text-base">
            {(userName || settings.name || 'US').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">{userName || settings.name || 'Usuário'}</h4>
            <p className="label-xs">{userEmail || settings.email || 'seu@email.com'}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-ink-faint" />
      </div>

      {/* ── PERFIL ──
           Antes havia seis <div onClick> sem handler: seis setas apontando
           para telas que não existiam. Os campos abaixo gravam em
           settings.name / settings.email, que o app realmente consome
           (saudação do Dashboard, cabeçalho do perfil).
           Notificações, Segurança e Privacidade foram removidas: nada as
           lê, nada produz alertas e "tema" não tem implementação clara. ── */}
      <div>
        <p className="label-section mb-3 px-0.5">Perfil</p>
        <div className="card p-4 space-y-4">
          <div>
            <label htmlFor="settings-name" className="field-label">
              Nome
            </label>
            <input
              id="settings-name"
              className="field"
              value={profileName}
              maxLength={60}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="field-label">
              E-mail
            </label>
            <input
              id="settings-email"
              type="email"
              inputMode="email"
              className="field"
              value={profileEmail}
              maxLength={120}
              onChange={(e) => setProfileEmail(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Usado apenas para identificar o backup exportado. Não é sincronizado.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="btn btn-primary btn-sm"
          >
            {isSavingProfile ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      </div>

      {/* ── INFORMAÇÕES ──
           Valores reais e somente leitura. Sem seta, porque não há para onde
           ir: o app é dark-only e pt-BR. ── */}
      <div className="card p-4 flex items-start gap-3">
        <Info size={16} className="text-ink-faint shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-ink-muted leading-relaxed min-w-0">
          <p>
            <span className="font-semibold text-ink">Aparência:</span> Escuro{' '}
            <span className="text-ink-faint">(único tema)</span>
          </p>
          <p className="mt-1">
            <span className="font-semibold text-ink">Idioma:</span> Português (Brasil){' '}
            <span className="text-ink-faint">(único idioma)</span>
          </p>
          <p className="mt-2 text-ink-faint">
            Todos os dados ficam neste navegador. Não há sincronização em nuvem.
          </p>
        </div>
      </div>

      {/* ── DATA MANAGEMENT ── */}
      <div>
        <p className="label-section mb-3 px-0.5">Dados</p>
        <div className="card overflow-hidden divide-y divide-edge">
          <div
            onClick={handleExportBackup}
            className="flex items-center justify-between p-4 hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Download size={16} className="text-accent-text" />
              <span className="text-xs font-semibold text-ink">Exportar dados (Backup JSON)</span>
            </div>
            <ChevronRight size={14} className="text-ink-faint" />
          </div>

          <div
            onClick={() => backupInputRef.current?.click()}
            className="flex items-center justify-between p-4 hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <div className="flex items-center space-x-3">
              <Upload size={16} className="text-info" />
              <span className="text-xs font-semibold text-ink">Restaurar backup JSON</span>
            </div>
            <ChevronRight size={14} className="text-ink-faint" />
          </div>

          <div
            onClick={handleSeedDemo}
            className="flex items-center justify-between p-4 hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Sparkles size={16} className="text-warning" />
              <span className="text-xs font-semibold text-ink">Carregar dados de exemplo</span>
            </div>
            <ChevronRight size={14} className="text-ink-faint" />
          </div>
        </div>
      </div>

      {/* ── SESSION / LOGOUT ── */}
      <div>
        <p className="label-section mb-3 px-0.5">Sessão</p>
        <div className="card overflow-hidden">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-between p-4 hover:bg-surface-raised transition-colors text-left text-xs font-semibold text-ink-muted hover:text-negative group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <LogOut size={16} className="text-accent-text group-hover:text-negative transition-colors" />
              <span>Sair da conta</span>
            </div>
            <ChevronRight size={14} className="text-ink-faint" />
          </button>
        </div>
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="card p-4 border-negative/15">
        {confirmClear ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-negative text-xs font-bold">
              <AlertTriangle size={16} />
              <span>Tem certeza que deseja apagar todos os dados?</span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Esta ação excluirá todas as transações, contas, cartões e orçamentos do banco local do seu dispositivo.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleResetData}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-3 rounded-xl bg-negative hover:bg-negative text-on-accent text-xs font-bold transition-colors"
              >
                {isProcessing ? 'Apagando...' : 'Sim, apagar tudo'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="py-2.5 px-4 rounded-xl bg-surface-raised text-ink-muted text-xs font-semibold hover:text-ink transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full flex items-center justify-between text-negative/70 hover:text-negative text-xs font-semibold transition-colors"
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
