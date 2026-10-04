import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ArrowRight, RefreshCw, MessageCircle, Bot, Check, X, ShieldAlert, BarChart2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { aiService } from '../financialAI/aiService';
import { executeActionPlan } from '../financialAI/actionExecutor';
import type { AIResponse, AIActionPlan } from '../financialAI/types';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  responseObj?: AIResponse;
  timestamp: string;
}

/* ─── Proactive agent card ─── */
const AgentCard: React.FC<{
  emoji: string;
  title: string;
  desc: string;
  status: 'active' | 'idle';
}> = ({ emoji, title, desc, status }) => (
  <div className="card p-4 flex items-start space-x-3.5">
    <div className="w-10 h-10 rounded-2xl bg-[#121419] flex items-center justify-center text-lg shrink-0">
      {emoji}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs font-semibold text-[#F5F5F5]">{title}</p>
        <span className={`pill ${status === 'active' ? 'pill-positive' : 'pill-neutral'} text-[10px]`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${status === 'active' ? 'bg-[#39D98A]' : 'bg-[#5F6570]'}`} />
          {status === 'active' ? 'Ativo' : 'Em pausa'}
        </span>
      </div>
      <p className="label-xs leading-relaxed">{desc}</p>
    </div>
  </div>
);

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    transactions, 
    accounts, 
    cards, 
    budgets, 
    goals, 
    investments, 
    categories, 
    bills,
    receivables,
    recurringTransactions,
    subscriptions,
    refreshAll,
  } = useFinance();

  const [tab, setTab] = useState<'chat' | 'agents'>('chat');
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Olá! Sou seu assistente financeiro pessoal. Analiso seus dados localmente — sem enviar nada para a nuvem.\n\nComo posso te ajudar hoje?',
      timestamp: 'Agora',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const suggestions = [
    'Como estão minhas finanças?',
    'Quanto gastei este mês?',
    'Quais contas vencem essa semana?',
    'Posso gastar R$ 500?',
    'Quanto falta para minha meta?',
    'Gastei 50 reais no supermercado',
    'Transfira 200 reais da conta corrente para carteira'
  ];

  const handleAsk = async (question: string) => {
    const q = question.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    try {
      const financialState = {
        accounts,
        transactions,
        categories,
        cards,
        goals,
        budgets,
        bills,
        receivables,
        recurring: recurringTransactions,
        subscriptions,
        investments,
      };

      const response = await aiService.processMessage(q, financialState);
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: response.text,
          responseObj: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'assistant',
          text: 'Não consegui analisar seus dados agora. Tente reformular a pergunta.',
          timestamp: 'Agora',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmPlan = async (plan: AIActionPlan) => {
    plan.status = 'confirmed';
    const result = await executeActionPlan(plan);
    if (result.success) {
      await refreshAll();
    }
    setMessages(prev => [
      ...prev,
      {
        id: `ai_action_res_${Date.now()}`,
        sender: 'assistant',
        text: result.success ? `✅ **Ação Executada!**\n\n${result.message}` : `❌ **Falha:** ${result.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const handleCancelPlan = (plan: AIActionPlan) => {
    plan.status = 'cancelled';
    setMessages(prev => [
      ...prev,
      {
        id: `ai_cancel_${Date.now()}`,
        sender: 'assistant',
        text: '🚫 Ação cancelada. Nenhum dado foi modificado.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const proactiveAgents = [
    { emoji: '📊', title: 'Controle de gastos', desc: 'Monitora seus gastos e avisa quando você ultrapassar limites.', status: 'active' as const },
    { emoji: '🎯', title: 'Alerta de orçamento', desc: 'Notifica quando seu orçamento mensal atingir 80%.', status: 'active' as const },
    { emoji: '💳', title: 'Vencimento de faturas', desc: 'Lembra do vencimento dos seus cartões com 5 dias de antecedência.', status: 'active' as const },
    { emoji: '⏰', title: 'Contas a pagar', desc: 'Avisa com antecedência sobre boletos e vencimentos da semana.', status: 'active' as const },
    { emoji: '📅', title: 'Fluxo de caixa & Saldo projetado', desc: 'Detecta risco de saldo baixo antes da próxima receita.', status: 'active' as const },
    { emoji: '🏆', title: 'Progresso das metas', desc: 'Acompanha o progresso das suas metas e sugere aportes.', status: 'idle' as const },
  ];

  return (
    <div
      className="flex flex-col animate-fade-in h-[calc(100dvh-var(--bottom-nav-h)-max(12px,env(safe-area-inset-bottom))-max(16px,env(safe-area-inset-top))-24px)] md:h-[calc(100dvh-80px)]"
    >
      {/* ── HEADER ── */}
      <div className="pt-2 pb-3 px-1 shrink-0">
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src="/logo.png" 
            alt="MyFinance AI" 
            className="w-10 h-10 rounded-2xl object-contain bg-black border border-[#222733] shadow-md shadow-[#8B7CFF]/15" 
          />
          <div>
            <h1 className="text-base font-bold text-[#F5F5F5] tracking-tight">IA Financeira Local</h1>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A]" />
              <span className="label-xs text-[#39D98A]">Modo Privado / Offline</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#0D0F12] border border-[#1D2026] rounded-2xl">
          {[
            { key: 'chat', label: 'Conversar', icon: MessageCircle },
            { key: 'agents', label: 'Assistentes', icon: Bot },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as 'chat' | 'agents')}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === key ? 'bg-[#121419] text-[#F5F5F5] shadow-sm' : 'text-[#8B919B] hover:text-[#F5F5F5]'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: CHAT ── */}
      {tab === 'chat' && (
        <div className="flex flex-col flex-1 min-h-0 px-1">
          {/* Suggestions (only early in chat) */}
          {messages.length <= 2 && (
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(s)}
                  className="card card-hover p-3 text-left flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-[#F5F5F5] leading-snug">{s}</span>
                  <ArrowRight size={12} className="text-[#5F6570] group-hover:text-[#8B7CFF] shrink-0 ml-2 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-2 scrollbar-none">
            {messages.map(m => {
              const isUser = m.sender === 'user';
              const visual = m.responseObj?.visual;
              const plan = m.responseObj?.actionPlan;

              return (
                <div key={m.id} className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {!isUser && (
                    <img 
                      src="/logo.png" 
                      alt="MyFinance Bot" 
                      className="w-7 h-7 rounded-full object-contain bg-black border border-[#222733] shrink-0 mb-1" 
                    />
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] px-4 py-3 rounded-3xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#8B7CFF] text-white rounded-br-sm'
                        : 'bg-[#14171D] border border-[#222733] text-[#F5F5F5] rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {m.text.split('**').map((part, idx) =>
                        idx % 2 === 1
                          ? <strong key={idx} className="font-bold text-white">{part}</strong>
                          : part,
                      )}
                    </div>

                    {/* Visual Component Render */}
                    {visual && visual.items && visual.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#222733] space-y-2">
                        {visual.title && <p className="label-xs text-[#8E95A3] mb-2">{visual.title}</p>}
                        {visual.items.map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-white">
                              <span>{item.label}</span>
                              <span>{item.formattedValue}</span>
                            </div>
                            {item.percentage !== undefined && (
                              <div className="w-full h-1.5 bg-[#1F2430] rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all" 
                                  style={{ 
                                    width: `${Math.min(100, item.percentage)}%`, 
                                    backgroundColor: item.color || '#8B7CFF' 
                                  }} 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Visual Math Breakdown Render */}
                    {visual && visual.breakdown && visual.breakdown.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#222733] space-y-1.5">
                        {visual.title && <p className="label-xs text-[#8E95A3] mb-2">{visual.title}</p>}
                        {visual.breakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] py-1 border-b border-[#222733]/50 last:border-none">
                            <span className="text-[#8E95A3]">{item.label}</span>
                            <span className={`font-bold ${item.isPositive === false ? 'text-[#FF5C5C]' : item.isPositive === true ? 'text-[#39D98A]' : 'text-white'}`}>
                              {item.formattedAmount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    {m.responseObj?.explanation && (
                      <p className="mt-2 text-[10px] text-[#5F6570] italic border-l-2 border-[#8B7CFF] pl-2">
                        {m.responseObj.explanation}
                      </p>
                    )}

                    {/* Action Plan Confirmation Box */}
                    {plan && plan.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t border-[#222733] space-y-2">
                        <div className="flex items-center space-x-1.5 text-[#F59E0B] text-[11px] font-bold">
                          <ShieldAlert size={14} />
                          <span>Confirmação Exigida ({plan.riskLevel})</span>
                        </div>
                        <div className="bg-[#121419] p-3 rounded-2xl border border-[#222733] space-y-1 text-[11px]">
                          {Object.entries(plan.details).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-[#8E95A3]">{k}:</span>
                              <span className="font-semibold text-white">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleConfirmPlan(plan)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#39D98A] text-[#0D0F12] font-bold text-xs flex items-center justify-center space-x-1 hover:bg-[#32c57c] transition-all"
                          >
                            <Check size={14} />
                            <span>Confirmar</span>
                          </button>
                          <button
                            onClick={() => handleCancelPlan(plan)}
                            className="py-2 px-3 rounded-xl bg-[#1A1F29] hover:bg-[#222733] text-[#8E95A3] hover:text-white text-xs font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Suggestions Buttons */}
                    {m.responseObj?.followUpSuggestions && m.responseObj.followUpSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                        {m.responseObj.followUpSuggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleAsk(sug)}
                            className="px-2.5 py-1 rounded-lg bg-[#1A1F29] hover:bg-[#222733] text-[#8B7CFF] text-[11px] font-semibold transition-colors flex items-center space-x-1 border border-[#262C3A]"
                          >
                            <span>{sug}</span>
                            <ArrowRight size={10} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-end gap-2.5">
                <img 
                  src="/logo.png" 
                  alt="MyFinance Bot" 
                  className="w-7 h-7 rounded-full object-contain bg-black border border-[#222733] shrink-0 mb-1" 
                />
                <div className="bg-[#14171D] border border-[#222733] px-4 py-3 rounded-3xl rounded-bl-sm flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CFF] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CFF] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CFF] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="pt-2 pb-1 shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAsk(inputQuestion);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-2xl bg-[#14171D] border border-[#222733] focus-within:border-[#8B7CFF] transition-all min-h-[48px]"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                placeholder="Pergunte algo ou solicite uma ação..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#5F6570] focus:outline-none"
                style={{ fontSize: '16px' }}
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-[#8B7CFF] disabled:bg-[#1A1F29] disabled:text-[#5F6570] text-white flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-sm min-w-[40px] min-h-[40px]"
                aria-label="Enviar mensagem"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB: AGENTS ── */}
      {tab === 'agents' && (
        <div className="flex-1 overflow-y-auto space-y-2.5 px-1 pr-1">
          <p className="label-xs mb-3">Agentes em segundo plano:</p>
          {proactiveAgents.map(a => (
            <AgentCard key={a.title} {...a} />
          ))}
        </div>
      )}
    </div>
  );
};
