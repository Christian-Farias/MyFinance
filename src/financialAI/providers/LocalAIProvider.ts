import type { AIProvider, AIResponse, AIConversationContext } from '../types';
import { parseUserIntent } from '../parsers/intentParser';
import { createActionPlan } from '../actionPlanner';
import { generateResponse } from '../responseGenerator';
import { FinancialState } from '../tools/financialTools';

export class LocalAIProvider implements AIProvider {
  async processQuery(
    query: string,
    context: AIConversationContext,
    financialState: FinancialState
  ): Promise<AIResponse> {
    // 1. Parse user intent and extract parameters
    const parsedIntent = parseUserIntent(query, financialState.categories, financialState.accounts);

    // 2. Resolve contextual memory if query relies on previous topic (e.g., "E no mês passado?", "E alimentação?")
    if (parsedIntent.intent === 'GET_EXPENSES' && context.lastIntent === 'GET_CATEGORY_SPENDING' && context.lastCategoryQuery) {
      parsedIntent.intent = 'GET_CATEGORY_SPENDING';
      parsedIntent.parameters.categoryQuery = context.lastCategoryQuery;
      parsedIntent.parameters.categoryId = context.lastCategoryId;
    }

    // 3. Save memory context for multi-turn conversations
    context.lastIntent = parsedIntent.intent;
    if (parsedIntent.parameters.categoryQuery) {
      context.lastCategoryQuery = parsedIntent.parameters.categoryQuery;
      context.lastCategoryId = parsedIntent.parameters.categoryId;
    }

    // 4. Create action plan if intent represents a state mutation
    const actionPlan = createActionPlan(
      parsedIntent.intent,
      parsedIntent.parameters,
      financialState.categories,
      financialState.accounts
    );

    if (actionPlan && actionPlan.requiresConfirmation) {
      context.pendingActionPlan = actionPlan;
    }

    // 5. Generate response payload with text, visual widgets, and follow-ups
    return generateResponse(
      parsedIntent.intent,
      query,
      financialState,
      actionPlan,
      parsedIntent.parameters
    );
  }
}
