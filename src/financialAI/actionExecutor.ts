import type { AIActionPlan } from './types';
import { transactionService } from '../services/transactionService';
import { transferService } from '../services/transferService';
import { billService } from '../services/billService';
import { receivableService } from '../services/receivableService';
import { goalService } from '../services/goalService';
import { budgetService } from '../services/budgetService';

export async function executeActionPlan(
  plan: AIActionPlan
): Promise<{ success: boolean; message: string; resultData?: any }> {
  if (plan.status !== 'confirmed') {
    return {
      success: false,
      message: 'Ação não foi confirmada pelo usuário.',
    };
  }

  try {
    const { type, data } = plan.payload;

    switch (type) {
      case 'CREATE_EXPENSE':
      case 'CREATE_INCOME': {
        const created = await transactionService.create(data);
        return {
          success: true,
          message: `${data.type === 'expense' ? 'Despesa' : 'Receita'} de ${data.description} registrada com sucesso!`,
          resultData: created,
        };
      }

      case 'CREATE_TRANSFER': {
        const transferTx = await transferService.transferBetweenAccounts({
          sourceAccountId: data.sourceAccountId,
          destinationAccountId: data.destinationAccountId,
          amount: data.amount,
          description: data.description,
          date: data.date,
        });
        return {
          success: true,
          message: `Transferência realizada com sucesso!`,
          resultData: transferTx,
        };
      }

      case 'CREATE_BILL': {
        const bill = await billService.create(data);
        return {
          success: true,
          message: `Conta ${bill.description} agendada com sucesso!`,
          resultData: bill,
        };
      }

      case 'CREATE_GOAL': {
        const goal = await goalService.create(data);
        return {
          success: true,
          message: `Meta ${goal.name} criada com sucesso!`,
          resultData: goal,
        };
      }

      case 'DELETE_TRANSACTION': {
        if (data.targetTransactionId) {
          await transactionService.delete(data.targetTransactionId);
          return {
            success: true,
            message: `Movimentação ${data.description} excluída com sucesso.`,
          };
        }
        // Find match by description/amount if id not explicit
        const allTxs = await transactionService.getAll();
        const match = allTxs.find(t => 
          (data.amount ? Math.abs(t.amount - data.amount) < 0.01 : true) &&
          (data.description ? t.description.toLowerCase().includes(data.description.toLowerCase()) : true)
        );
        if (match) {
          await transactionService.delete(match.id);
          return {
            success: true,
            message: `Movimentação ${match.description} excluída com sucesso.`,
          };
        }
        return {
          success: false,
          message: 'Não foi possível encontrar a movimentação exata para exclusão.',
        };
      }

      default:
        return {
          success: false,
          message: `Intenção de ação ${type} não suportada para execução direta.`,
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao executar a ação: ${(error as Error).message}`,
    };
  }
}
