import type { AIProvider, AIResponse, AIConversationContext } from '../types';
import { parseUserIntent } from '../parsers/intentParser';
import { createActionPlan } from '../actionPlanner';
import { generateResponse } from '../responseGenerator';
import { resolveConversationContext, updateConversationContext } from '../contextResolver';
import { FinancialState } from '../tools/financialTools';

export class LocalAIProvider implements AIProvider {
  async processQuery(
    query: string,
    context: AIConversationContext,
    financialState: FinancialState
  ): Promise<AIResponse> {
    // 1. Parse raw user intent and extract parameters & entities
    let parsedIntent = parseUserIntent(
      query,
      financialState.categories,
      financialState.accounts,
      financialState.cards,
      financialState.goals
    );

    // 2. Resolve multi-turn contextual memory (e.g. "E no mês passado?", "E transporte?", "Agora compara os dois")
    parsedIntent = resolveConversationContext(parsedIntent, query, context);

    // 3. Save / update contextual memory for subsequent turns
    updateConversationContext(parsedIntent, context);

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

    // 5. Generate response payload with rich text, visual widgets, and contextual follow-ups
    return generateResponse(
      parsedIntent.intent,
      query,
      financialState,
      actionPlan,
      parsedIntent.parameters
    );
  }
}

