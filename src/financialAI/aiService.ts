import type { AIResponse, AIConversationContext, AIChatMessage } from './types';
import { LocalAIProvider } from './providers/LocalAIProvider';
import { processConfirmationResponse } from './confirmationService';
import type { FinancialState } from './tools/financialTools';

const conversationMemory: AIConversationContext = {
  messagesHistory: [],
};

const aiProvider = new LocalAIProvider();

export const aiService = {
  getMemoryContext(): AIConversationContext {
    return conversationMemory;
  },

  clearHistory(): void {
    conversationMemory.messagesHistory = [];
    conversationMemory.lastIntent = undefined;
    conversationMemory.lastCategoryQuery = undefined;
    conversationMemory.pendingActionPlan = undefined;
  },

  async processMessage(userQuery: string, state: FinancialState): Promise<AIResponse> {
    // 1. Check if user is confirming or cancelling a pending action plan
    if (conversationMemory.pendingActionPlan) {
      const confirmResult = await processConfirmationResponse(userQuery, conversationMemory);
      if (confirmResult.handled) {
        return {
          text: confirmResult.responseText,
          intent: 'UNKNOWN',
          followUpSuggestions: ['Quanto gastei este mês?', 'Qual meu saldo?', 'Como estão minhas finanças?'],
        };
      }
    }

    // 2. Delegate to active AI provider (LocalAIProvider)
    const response = await aiProvider.processQuery(userQuery, conversationMemory, state);

    // 3. Save message in memory history
    const userMsg: AIChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toISOString(),
    };
    const botMsg: AIChatMessage = {
      id: `msg_${Date.now()}_b`,
      sender: 'assistant',
      text: response.text,
      timestamp: new Date().toISOString(),
      visual: response.visual,
      actionPlan: response.actionPlan,
      suggestions: response.followUpSuggestions,
    };

    conversationMemory.messagesHistory.push(userMsg, botMsg);

    return response;
  }
};
