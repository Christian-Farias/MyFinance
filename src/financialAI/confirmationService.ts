import type { AIActionPlan, AIConversationContext } from './types';
import { executeActionPlan } from './actionExecutor';

export async function processConfirmationResponse(
  userText: string,
  context: AIConversationContext
): Promise<{ handled: boolean; responseText: string; actionSuccess?: boolean }> {
  const pendingPlan = context.pendingActionPlan;
  if (!pendingPlan) {
    return { handled: false, responseText: '' };
  }

  const lower = userText.toLowerCase().trim();

  // Affirmative responses
  if (
    lower === 'sim' ||
    lower === 'confirmar' ||
    lower === 'confirma' ||
    lower.includes('pode registrar') ||
    lower.includes('pode transferir') ||
    lower.includes('pode agendar') ||
    lower.includes('pode excluir') ||
    lower.includes('ok')
  ) {
    pendingPlan.status = 'confirmed';
    const result = await executeActionPlan(pendingPlan);
    context.pendingActionPlan = undefined;

    return {
      handled: true,
      responseText: result.success 
        ? `✅ **Ação Executada!**\n\n${result.message}`
        : `❌ **Falha ao Executar:** ${result.message}`,
      actionSuccess: result.success,
    };
  }

  // Negative / Cancel responses
  if (
    lower === 'não' ||
    lower === 'nao' ||
    lower === 'cancelar' ||
    lower.includes('cancela') ||
    lower.includes('desistir')
  ) {
    pendingPlan.status = 'cancelled';
    context.pendingActionPlan = undefined;

    return {
      handled: true,
      responseText: '🚫 **Ação cancelada.** Nenhuma alteração foi realizada no sistema.',
      actionSuccess: false,
    };
  }

  return { handled: false, responseText: '' };
}
