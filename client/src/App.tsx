import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './features/auth/pages/LoginPage.tsx';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage.tsx';
import DashboardPage from './features/dashboard/pages/DashboardPage.tsx';
import ProjectsPage from './features/projects/pages/ProjectsPage.tsx';
import ReportsListPage from './features/reports/pages/ReportsListPage.tsx';
import ReportEditorPage from './features/reports/pages/ReportEditorPage.tsx';
import NewsCoveragePage from './features/projects/pages/NewsCoveragePage.tsx';
import UsersPage from './features/users/pages/UsersPage.tsx';
import Layout from './components/Layout.tsx';
import { useAuthStore } from './features/auth/store/authStore.ts';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { token, user } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{
        className: 'bg-surface border border-border text-text-primary',
        style: {
          background: 'var(--color-bg)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        },
      }} />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="news" element={<NewsCoveragePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="reports" element={<ReportsListPage />} />
            <Route path="reports/:id" element={<ReportEditorPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
