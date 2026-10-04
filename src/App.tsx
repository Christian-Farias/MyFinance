import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

/**
 * Routes are code-split. Statically importing all 17 pages plus Recharts and
 * the AI client shipped every screen in the entry chunk; the initial bundle
 * was the reason for the >500 kB build warning.
 */
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })));
const AccountsPage = lazy(() => import('./pages/AccountsPage').then((m) => ({ default: m.AccountsPage })));
const CardsPage = lazy(() => import('./pages/CardsPage').then((m) => ({ default: m.CardsPage })));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage })));
const MonthlyComparisonPage = lazy(() => import('./pages/MonthlyComparisonPage').then((m) => ({ default: m.MonthlyComparisonPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })));
const ImportPage = lazy(() => import('./pages/ImportPage').then((m) => ({ default: m.ImportPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const CommitmentsPage = lazy(() => import('./pages/CommitmentsPage').then((m) => ({ default: m.CommitmentsPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const CashFlowPage = lazy(() => import('./pages/CashFlowPage').then((m) => ({ default: m.CashFlowPage })));
const MonthlyClosingPage = lazy(() => import('./pages/MonthlyClosingPage').then((m) => ({ default: m.MonthlyClosingPage })));

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