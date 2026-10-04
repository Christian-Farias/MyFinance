import { getDB } from '../database/db';
import type { SmartAlert, Transaction, Budget, CreditCard, Goal, Category } from '../types';
import { calculateBudgetUsage, calculateMonthlyComparison } from '../calculations/financialCalculations';

export const alertService = {
  async getAll(): Promise<SmartAlert[]> {
    const db = await getDB();
    const list = await db.getAll('alerts');
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async markAsRead(id: string): Promise<void> {
    const db = await getDB();
    const alert = await db.get('alerts', id);
    if (alert) {
      alert.isRead = true;
      await db.put('alerts', alert);
    }
  },

  async markAllAsRead(): Promise<void> {
    const db = await getDB();
    const all = await db.getAll('alerts');
    const tx = db.transaction('alerts', 'readwrite');
    for (const a of all) {
      a.isRead = true;
      await tx.store.put(a);
    }
    await tx.done;
  },

  async addAlert(alert: Omit<SmartAlert, 'id' | 'date'> & { id?: string; date?: string }): Promise<SmartAlert> {
    const db = await getDB();
    const newAlert: SmartAlert = {
      ...alert,
      id: alert.id || `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: alert.date || new Date().toISOString(),
    };
    await db.put('alerts', newAlert);
    return newAlert;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('alerts', id);
  },

  /**
   * Generates dynamic contextual alerts based on actual user data
   */
  async generateDynamicAlerts(
    transactions: Transaction[],
    budgets: Budget[],
    categories: Category[],
    cards: CreditCard[],
    goals: Goal[],
    currentYearMonth: string
  ): Promise<SmartAlert[]> {
    const generated: SmartAlert[] = [];
    const today = new Date();
    const todayDay = today.getDate();

    // 1. Check Budgets
    const budgetReports = calculateBudgetUsage(budgets, transactions, categories, currentYearMonth);
    for (const r of budgetReports) {
      if (r.percentage >= 100) {
        generated.push({
          id: `dyn_bg_exc_${r.budget.id}`,
          type: 'budget',
          title: 'Orçamento excedido',
          message: `Você ultrapassou o limite do orçamento de ${r.category?.name || 'Categoria'} (${r.percentage.toFixed(0)}%).`,
          date: new Date().toISOString(),
          isRead: false,
          isImportant: true,
          actionUrl: '/orcamentos'
        });
      } else if (r.percentage >= 80) {
        generated.push({
          id: `dyn_bg_warn_${r.budget.id}`,
          type: 'budget',
          title: 'Orçamento',
          message: `Você utilizou ${r.percentage.toFixed(0)}% do orçamento de ${r.category?.name || 'Categoria'}.`,
          date: new Date().toISOString(),
          isRead: false,
          isImportant: false,
          actionUrl: '/orcamentos'
        });
      }
    }

    // 2. Check Credit Cards Due Date
    for (const card of cards) {
      if (!card.isActive) continue;
      const daysUntilDue = card.dueDay - todayDay;
      if (daysUntilDue > 0 && daysUntilDue <= 5) {
        generated.push({
          id: `dyn_card_due_${card.id}`,
          type: 'invoice',
          title: 'Fatura próxima',
          message: `Sua fatura do cartão ${card.name} vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}.`,
          date: new Date().toISOString(),
          isRead: false,
          isImportant: true,
          actionUrl: '/cartoes'
        });
      }
    }

    // 3. Spending comparison alert
    const comparison = calculateMonthlyComparison(transactions, categories, currentYearMonth);
    if (comparison.expenseVariationPercent > 15) {
      generated.push({
        id: `dyn_spike_${currentYearMonth}`,
        type: 'expense_spike',
        title: 'Gasto elevado',
        message: `Seus gastos este mês estão ${comparison.expenseVariationPercent.toFixed(1)}% acima do mês anterior.`,
        date: new Date().toISOString(),
        isRead: false,
        isImportant: true,
        actionUrl: '/gastos'
      });
    }

    // 4. Goals progress alert
    for (const goal of goals) {
      const pct = (goal.currentAmount / goal.targetAmount) * 100;
      if (pct >= 50 && pct < 100) {
        generated.push({
          id: `dyn_goal_${goal.id}`,
          type: 'goal',
          title: 'Meta em progresso',
          message: `Você já conquistou ${pct.toFixed(0)}% da meta "${goal.name}". Falta pouco!`,
          date: new Date().toISOString(),
          isRead: false,
          isImportant: false,
          actionUrl: '/metas'
        });
      }
    }

    return generated;
  }
};
