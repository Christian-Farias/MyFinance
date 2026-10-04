import type { AIConversationContext, ParsedIntent } from './types';
import { normalizeText } from './parsers/entityExtractor';

const CONTEXT_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

export function resolveConversationContext(
  parsed: ParsedIntent,
  rawQuery: string,
  context: AIConversationContext
): ParsedIntent {
  const now = Date.now();
  const norm = normalizeText(rawQuery);

  // 1. Check expiration
  if (context.lastInteractionTimestamp && (now - context.lastInteractionTimestamp > CONTEXT_EXPIRATION_MS)) {
    // Invalidate stale memory
    context.lastIntent = undefined;
    context.lastCategoryQuery = undefined;
    context.lastCategoryId = undefined;
    context.secondLastCategoryQuery = undefined;
    context.secondLastCategoryId = undefined;
    context.lastDateRange = undefined;
    context.lastAccountId = undefined;
    context.lastCardId = undefined;
  }

  // If query is an explicit greeting or new command, do not inherit old entity context
  if (parsed.intent === 'HELP_GREETING' || parsed.intent === 'CREATE_TRANSFER' || parsed.intent === 'DELETE_TRANSACTION') {
    return parsed;
  }

  const isEllipsis =
    norm.startsWith('e ') ||
    norm.startsWith('e no ') ||
    norm.startsWith('e na ') ||
    norm.startsWith('e em ') ||
    norm.startsWith('e com ') ||
    norm.startsWith('e de ') ||
    norm.includes('compara os dois') ||
    norm.includes('compare os dois') ||
    norm.includes('qual foi maior') ||
    norm.includes('diferenca entre os dois') ||
    (parsed.intent === 'UNKNOWN' && (parsed.parameters.dateRange || parsed.parameters.categoryQuery));

  const hasExplicitDate =
    norm.includes('hoje') || norm.includes('ontem') || norm.includes('amanha') ||
    norm.includes('mes') || norm.includes('ano') || norm.includes('semana') ||
    norm.includes('dia') || norm.includes('dias') || norm.includes('trimestre') ||
    norm.includes('janeiro') || norm.includes('fevereiro') || norm.includes('marco') ||
    norm.includes('abril') || norm.includes('maio') || norm.includes('junho') ||
    norm.includes('julho') || norm.includes('agosto') || norm.includes('setembro') ||
    norm.includes('outubro') || norm.includes('novembro') || norm.includes('dezembro');

  // Case A: "Agora compara os dois" / "compara os dois"
  if (
    norm.includes('compara os dois') ||
    norm.includes('compare os dois') ||
    norm.includes('qual foi maior') ||
    norm.includes('diferenca entre os dois') ||
    (norm.includes('compara') && !parsed.parameters.categoryQuery && context.lastCategoryQuery && context.secondLastCategoryQuery)
  ) {
    if (context.lastCategoryQuery && context.secondLastCategoryQuery) {
      parsed.intent = 'GET_CATEGORY_COMPARISON';
      parsed.parameters.categoryQuery = context.secondLastCategoryQuery;
      parsed.parameters.categoryId = context.secondLastCategoryId;
      parsed.parameters.secondCategoryQuery = context.lastCategoryQuery;
      parsed.parameters.secondCategoryId = context.lastCategoryId;
      if (!hasExplicitDate && context.lastDateRange) {
        parsed.parameters.dateRange = context.lastDateRange;
      }
      parsed.confidence = 0.95;
      return parsed;
    }
  }


  // Case B: "E no mês passado?" / Ellipsis altering only the date period
  if (
    (isEllipsis || parsed.intent === 'GET_EXPENSES' || parsed.intent === 'UNKNOWN') &&
    (norm.includes('mes passado') || norm.includes('ano passado') || norm.includes('semana passada') || norm.includes('este ano') || norm.includes('outubro') || norm.includes('setembro') || norm.includes('ultimos 30')) &&
    !parsed.parameters.categoryQuery &&
    context.lastCategoryQuery
  ) {
    // Retain previous category query, only updating date range
    if (context.lastIntent === 'GET_CATEGORY_SPENDING' || context.lastIntent === 'GET_EXPENSES') {
      parsed.intent = 'GET_CATEGORY_SPENDING';
      parsed.parameters.categoryQuery = context.lastCategoryQuery;
      parsed.parameters.categoryId = context.lastCategoryId;
      parsed.confidence = 0.95;
      return parsed;
    }
  }

  // Case C: "E transporte?" / User provides a category, inheriting the active date period
  if (
    (isEllipsis || parsed.intent === 'GET_CATEGORY_SPENDING' || parsed.intent === 'UNKNOWN') &&
    parsed.parameters.categoryQuery
  ) {
    parsed.intent = 'GET_CATEGORY_SPENDING';
    // If user didn't specify a new date range, inherit the last used date range (e.g., "mes passado")
    if (context.lastDateRange && (!rawQuery.toLowerCase().includes('mes') && !rawQuery.toLowerCase().includes('hoje') && !rawQuery.toLowerCase().includes('ano') && !rawQuery.toLowerCase().includes('semana'))) {
      parsed.parameters.dateRange = context.lastDateRange;
      parsed.parameters.date = context.lastDateRange.startDate;
    }
    parsed.confidence = 0.95;
    return parsed;
  }

  // Case D: "E receitas?" / "E entradas?"
  if (isEllipsis && (norm.includes('receita') || norm.includes('recebi') || norm.includes('entradas'))) {
    parsed.intent = 'GET_INCOME';
    if (context.lastDateRange) {
      parsed.parameters.dateRange = context.lastDateRange;
    }
    parsed.confidence = 0.93;
    return parsed;
  }

  // Case E: "E no Nubank?" / "E na carteira?"
  if (isEllipsis && (parsed.parameters.accountId || parsed.parameters.cardId)) {
    if (context.lastIntent === 'GET_CARD_BILL' || parsed.parameters.cardId) {
      parsed.intent = 'GET_CARD_BILL';
    } else {
      parsed.intent = 'GET_BALANCE';
    }
    parsed.confidence = 0.92;
    return parsed;
  }

  return parsed;
}

export function updateConversationContext(
  parsed: ParsedIntent,
  context: AIConversationContext
): void {
  context.lastIntent = parsed.intent;
  context.lastInteractionTimestamp = Date.now();

  if (parsed.parameters.dateRange) {
    context.lastDateRange = parsed.parameters.dateRange;
  }

  if (parsed.parameters.categoryQuery) {
    // If querying a new category, rotate memory so we have 2 for comparison
    if (context.lastCategoryQuery && context.lastCategoryQuery.toLowerCase() !== parsed.parameters.categoryQuery.toLowerCase()) {
      context.secondLastCategoryQuery = context.lastCategoryQuery;
      context.secondLastCategoryId = context.lastCategoryId;
    }
    context.lastCategoryQuery = parsed.parameters.categoryQuery;
    context.lastCategoryId = parsed.parameters.categoryId;
  }

  if (parsed.parameters.accountId) {
    context.lastAccountId = parsed.parameters.accountId;
    context.lastAccountQuery = parsed.parameters.accountQuery;
  }

  if (parsed.parameters.cardId) {
    context.lastCardId = parsed.parameters.cardId;
    context.lastCardQuery = parsed.parameters.cardQuery;
  }
}
