import type { AIIntentType, AIRiskLevel, AIActionPlan, IntentParameters } from './types';
import { formatCurrency, formatDateBR } from '../calculations/financialCalculations';
import type { Category, Account } from '../types';

export function createActionPlan(
  intent: AIIntentType,
  params: IntentParameters,
  categories: Category[],
  accounts: Account[]
): AIActionPlan | undefined {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowStr = new Date().toISOString().split('T')[0];

  // Map Category & Account IDs or fallbacks
  const category = categories.find(c => c.id === params.categoryId || c.name.toLowerCase() === params.categoryQuery?.toLowerCase());
  const categoryId = category ? category.id : (categories[0]?.id || 'outros');
  const categoryName = category ? category.name : 'Alimentação';

  const account = accounts.find(a => a.id === params.accountId || a.name.toLowerCase() === params.accountQuery?.toLowerCase());
  const accountId = account ? account.id : (accounts[0]?.id || '');
  const accountName = account ? account.name : (accounts[0]?.name || 'Conta Corrente');

  const destAccount = accounts.find(a => a.id === params.destinationAccountId || a.name.toLowerCase() === params.destinationAccountQuery?.toLowerCase());
  const destAccountId = destAccount ? destAccount.id : (accounts[1]?.id || accounts[0]?.id || '');
  const destAccountName = destAccount ? destAccount.name : (accounts[1]?.name || 'Carteira');

  const amount = params.amount || 0;
  const date = params.date || nowStr;
  const description = params.description || 'Lançamento via IA';

  switch (intent) {
    case 'CREATE_EXPENSE': {
      const riskLevel: AIRiskLevel = 'MEDIUM';
      return {
        id: planId,
        intent,
        riskLevel,
        title: 'Registrar Despesa',
        summary: `Despesa de ${formatCurrency(amount)} em ${categoryName}`,
        details: {
          'Tipo': 'Despesa',
          'Valor': formatCurrency(amount),
          'Descrição': description,
          'Categoria': categoryName,
          'Conta': accountName,
          'Data': formatDateBR(date),
        },
        payload: {
          type: intent,
          data: {
            type: 'expense',
            amount,
            description,
            categoryId,
            accountId,
            date,
            isFixedExpense: params.isFixed || false,
          }
        },
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    case 'CREATE_INCOME': {
      const riskLevel: AIRiskLevel = 'MEDIUM';
      return {
        id: planId,
        intent,
        riskLevel,
        title: 'Registrar Receita',
        summary: `Receita de ${formatCurrency(amount)} (${description})`,
        details: {
          'Tipo': 'Receita',
          'Valor': formatCurrency(amount),
          'Descrição': description,
          'Categoria': 'Salário / Renda',
          'Conta': accountName,
          'Data': formatDateBR(date),
        },
        payload: {
          type: intent,
          data: {
            type: 'income',
            amount,
            description,
            categoryId: categories.find(c => c.type === 'income')?.id || categoryId,
            accountId,
            date,
          }
        },
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    case 'CREATE_TRANSFER': {
      const riskLevel: AIRiskLevel = 'HIGH';
      return {
        id: planId,
        intent,
        riskLevel,
        title: 'Transferência Entre Contas',
        summary: `Transferir ${formatCurrency(amount)} de ${accountName} para ${destAccountName}`,
        details: {
          'Valor': formatCurrency(amount),
          'Conta Origem': accountName,
          'Conta Destino': destAccountName,
          'Data': formatDateBR(date),
        },
        payload: {
          type: intent,
          data: {
            amount,
            sourceAccountId: accountId,
            destinationAccountId: destAccountId,
            description: `Transferência (${accountName} -> ${destAccountName})`,
            date,
          }
        },
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    case 'CREATE_BILL': {
      const riskLevel: AIRiskLevel = 'MEDIUM';
      return {
        id: planId,
        intent,
        riskLevel,
        title: 'Agendar Conta a Pagar',
        summary: `Conta: ${description} no valor de ${formatCurrency(amount)}`,
        details: {
          'Conta': description,
          'Valor': formatCurrency(amount),
          'Vencimento': formatDateBR(date),
          'Categoria': categoryName,
        },
        payload: {
          type: intent,
          data: {
            description,
            amount,
            dueDate: date,
            categoryId,
            accountId,
            status: 'pending',
          }
        },
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    case 'CREATE_GOAL': {
      const riskLevel: AIRiskLevel = 'MEDIUM';
      const targetAmount = params.targetAmount || amount;
      return {
        id: planId,
        intent,
        riskLevel,
        title: 'Criar Meta Financeira',
        summary: `Meta: ${description} com objetivo de ${formatCurrency(targetAmount)}`,
        details: {
          'Meta': description,
          'Valor Alvo': formatCurrency(targetAmount),
          'Prazo': params.deadline ? formatDateBR(params.deadline) : 'Sem prazo definido',
        },
        payload: {
          type: intent,
          data: {
            name: description || 'Nova Meta',
            targetAmount,
            deadline: params.deadline || '',
            color: '#8B7CFF',
          }
        },
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    case 'DELETE_TRANSACTION': {
      const riskLevel: AIRiskLevel = 'HIGH';
      return {
        id: planId,
        intent,
        riskLevel,
        title: 'Excluir Movimentação',
        summary: `Remover lançamento de ${formatCurrency(amount || 50)} (${description})`,
        details: {
          'Descrição': description,
          'Valor Estimado': formatCurrency(amount || 50),
          'Ação': 'Exclusão permanente de dados',
        },
        payload: {
          type: intent,
          data: {
            targetTransactionId: params.transactionId,
            description,
            amount,
          }
        },
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    default:
      return undefined;
  }
}
