import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { CardsPage } from './pages/CardsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { GoalsPage } from './pages/GoalsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { MonthlyComparisonPage } from './pages/MonthlyComparisonPage';
import { AlertsPage } from './pages/AlertsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ImportPage } from './pages/ImportPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommitmentsPage } from './pages/CommitmentsPage';
import { CalendarPage } from './pages/CalendarPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { MonthlyClosingPage } from './pages/MonthlyClosingPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/gastos" element={<ExpensesPage />} />
                <Route path="/transacoes" element={<TransactionsPage />} />
                <Route path="/contas" element={<AccountsPage />} />
                <Route path="/cartoes" element={<CardsPage />} />
                <Route path="/compromissos" element={<CommitmentsPage />} />
                <Route path="/calendario" element={<CalendarPage />} />
                <Route path="/fluxo-caixa" element={<CashFlowPage />} />
                <Route path="/fechamento" element={<MonthlyClosingPage />} />
                <Route path="/orcamentos" element={<BudgetsPage />} />
                <Route path="/metas" element={<GoalsPage />} />
                <Route path="/investimentos" element={<InvestmentsPage />} />
                <Route path="/comparacao" element={<MonthlyComparisonPage />} />
                <Route path="/alertas" element={<AlertsPage />} />
                <Route path="/ia" element={<AIAssistantPage />} />
                <Route path="/importar" element={<ImportPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
};

export default App;
