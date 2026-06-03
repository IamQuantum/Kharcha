import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoginView from "./features/auth/LoginView";
import DashboardView from "./features/dashboard/DashboardView";
import LedgerView from "./features/expenses/LedgerView";
import BudgetTrackingView from "./features/budgets/BudgetTrackingView";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardView />} />
            <Route path="ledger" element={<LedgerView />} />
            <Route path="budgets" element={<BudgetTrackingView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
