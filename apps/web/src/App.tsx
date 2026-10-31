import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';
import Spinner from './components/ui/Spinner';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';

// Authenticated Pages
import DashboardPage from './pages/DashboardPage';
import ActivityPage from './pages/ActivityPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import RiskEventsPage from './pages/admin/RiskEventsPage';

// Status Pages
import AccessDeniedPage from './pages/status/AccessDeniedPage';
import StepUpRequiredPage from './pages/status/StepUpRequiredPage';
import SessionExpiredPage from './pages/status/SessionExpiredPage';
import UnauthorizedPage from './pages/status/UnauthorizedPage';
import NotFoundPage from './pages/status/NotFoundPage';
import ServiceUnavailablePage from './pages/status/ServiceUnavailablePage';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center space-y-4">
        <Spinner size="xl" variant="cyber" />
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          Validating Security Tokens...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center space-y-4">
        <Spinner size="xl" variant="cyber" />
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          Verifying Administrative Clearance...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Marketing Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Flow Routes in AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
      </Route>

      {/* Authenticated Dashboard Routes in DashboardLayout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/activity" element={<ActivityPage />} />
      </Route>

      {/* Administrative SOC Routes in DashboardLayout */}
      <Route
        element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        <Route path="/admin/risk-events" element={<RiskEventsPage />} />
      </Route>

      {/* System Status Pages */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/step-up-required" element={<StepUpRequiredPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/service-unavailable" element={<ServiceUnavailablePage />} />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
