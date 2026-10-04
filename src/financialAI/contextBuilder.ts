import type { FinancialState } from './tools/financialTools';
import type { AIIntentType, AIConversationContext } from './types';

export function buildFinancialContext(
  intent: AIIntentType,
  state: FinancialState,
  conversationMemory?: AIConversationContext
) {
  // Extract targeted slices based on intent to maintain high performance
  switch (intent) {
    case 'GET_BALANCE':
      return { accounts: state.accounts };

    case 'GET_EXPENSES':
    case 'GET_CATEGORY_SPENDING':
      return {
        transactions: state.transactions.filter(t => t.type === 'expense'),
        categories: state.categories,
      };

    case 'GET_INCOME':
      return {
        transactions: state.transactions.filter(t => t.type === 'income'),
      };

    case 'GET_CARD_BILL':
    case 'GET_INSTALLMENTS':
      return {
        cards: state.cards,
        transactions: state.transactions.filter(t => t.cardId !== undefined || t.installmentTotal !== undefined),
      };

    case 'GET_BILLS':
      return { bills: state.bills };

    case 'GET_RECEIVABLES':
      return { receivables: state.receivables };

    case 'GET_SUBSCRIPTIONS':
      return { subscriptions: state.subscriptions };

    case 'GET_GOAL':
      return { goals: state.goals };

    case 'GET_BUDGET':
      return { budgets: state.budgets, categories: state.categories };

    case 'GET_FORECAST':
    case 'GET_CASH_FLOW':
    case 'CAN_I_SPEND':
    case 'GET_FINANCIAL_HEALTH':
    default:
      return state; // Full state needed for cash flow / health diagnosis
  }
}
