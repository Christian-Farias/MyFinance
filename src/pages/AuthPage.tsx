import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, isConfigured, bypassAuth } = useAuth();
  const signupEnabled = import.meta.env.VITE_ALLOW_SIGNUP === 'true';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos. Verifique seus dados.');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMsg('Por favor, confirme seu e-mail antes de acessar.');
      } else {
        setErrorMsg(error.message || 'Erro ao realizar login.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!signupEnabled) {
      setErrorMsg('O cadastro está fechado no momento. Fale com o administrador para criar sua conta.');
      return;
    }

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        setErrorMsg('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        setErrorMsg(error.message || 'Erro ao criar conta.');
      }
    } else {
      setSuccessMsg('Conta criada com sucesso! Você já pode entrar.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }, 2500);
    }
  };

  return (
    <div 
      className="min-h-[100dvh] w-full bg-[#050505] text-[#F5F5F5] flex flex-col justify-between px-4 sm:px-6 py-6"
      style={{
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      {/* ── TOP / LOGO ── */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center pt-2 sm:pt-6">
        <div className="relative mb-3">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#8B7CFF] to-[#6366F1] rounded-3xl blur-md opacity-30 animate-pulse" />
          <img 
            src="/logo.png" 
            alt="MyFinance" 
            className="relative w-16 h-16 rounded-2xl object-contain bg-black border border-[#222733] shadow-xl"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">MyFinance</h1>
        <p className="text-xs text-[#8E95A3] mt-0.5 text-center">
          Gestão financeira pessoal moderna, inteligente e segura.
        </p>
      </div>

      {/* ── CARD PRINCIPAL ── */}
      <div className="w-full max-w-sm mx-auto my-auto py-4">
        {/* Aviso se Supabase não configurado */}
        {!isConfigured && (
          <div className="mb-4 p-4 rounded-2xl bg-[#1A1829] border border-[#8B7CFF]/40 text-xs text-[#E0E2EC] space-y-2.5">
            <div className="flex items-center space-x-2 text-[#8B7CFF] font-bold">
              <Sparkles size={16} />
              <span>Configuração do Supabase</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#A4A9B6]">
              Para conectar o login em nuvem, adicione suas credenciais no arquivo <code className="bg-black/50 px-1 py-0.5 rounded text-[#8B7CFF]">.env</code>:
            </p>
            <pre className="p-2 rounded-xl bg-black/60 text-[10px] text-[#39D98A] font-mono overflow-x-auto">
              VITE_SUPABASE_URL=...&#10;VITE_SUPABASE_ANON_KEY=...
            </pre>
            <button
              type="button"
              onClick={bypassAuth}
              className="w-full py-2 px-3 rounded-xl bg-[#8B7CFF]/20 hover:bg-[#8B7CFF]/30 text-[#8B7CFF] text-xs font-bold transition-all text-center mt-1"
            >
              Continuar no Modo Local (Offline) →
            </button>
          </div>
        )}

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#2A1215] border border-[#FF5555]/30 text-[#FF5555] text-xs flex items-start space-x-2.5 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#132A1C] border border-[#39D98A]/30 text-[#39D98A] text-xs flex items-start space-x-2.5 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

          {/* ── LOGIN & REGISTER VIEW ── */}
        <div className="card p-6 border-[#222733] bg-[#0D0F12]">
          {/* Tabs de modo */}
          {signupEnabled ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#14171D] rounded-2xl border border-[#222733] mb-6">
              <button
                type="button"
                onClick={() => { clearMessages(); setMode('login'); }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-[#8B7CFF] text-white shadow-md'
                    : 'text-[#8E95A3] hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { clearMessages(); setMode('register'); }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-[#8B7CFF] text-white shadow-md'
                    : 'text-[#8E95A3] hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-white mb-4">Entrar na sua conta</h2>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {/* Campo Nome (Apenas Registro) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#8E95A3] mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6570]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como podemos te chamar?"
                    required
                    className="input-field pl-10 text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-semibold text-[#8E95A3] mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6570]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-field pl-10 text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-semibold text-[#8E95A3] mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6570]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pl-10 pr-10 text-sm"
                  style={{ fontSize: '16px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E95A3] hover:text-white p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmação de Senha (Apenas Registro) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#8E95A3] mb-1.5">Confirmar Senha</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6570]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    required
                    className="input-field pl-10 text-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-[#8B7CFF] hover:bg-[#7a6aeb] text-white font-bold text-sm shadow-lg shadow-[#8B7CFF]/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              <span>
                {isLoading 
                  ? 'Processando...' 
                  : mode === 'login' ? 'Entrar no MyFinance' : 'Criar Conta Gratuita'}
              </span>
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>

      {/* ── FOOTER DE SEGURANÇA ── */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-center space-x-1.5 text-[11px] text-[#5F6570] pt-2">
        <ShieldCheck size={14} className="text-[#39D98A]" />
        <span>Seus dados são protegidos com criptografia ponta a ponta.</span>
      </div>
    </div>
  );
};
