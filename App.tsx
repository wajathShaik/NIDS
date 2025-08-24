





import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AuditLogPage from './pages/AuditLogPage';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UserManagementPage from './pages/UserManagementPage';
import LogUploadPage from './pages/LogUploadPage';
import InvestigationListPage from './pages/InvestigationListPage';
import InvestigationWorkbenchPage from './pages/InvestigationWorkbenchPage';
import InboxPage from './pages/InboxPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import SopPage from './pages/SopPage';
import SearchPage from './pages/SearchPage';
import { Role } from './types';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyAccountPage from './pages/VerifyAccountPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import ToolsPage from './pages/ToolsPage';
import BehavioralAnalyticsPage from './pages/BehavioralAnalyticsPage';
import DroneSecurityPage from './pages/DroneSecurityPage';
import PlatformSecurityPage from './pages/PlatformSecurityPage';
import ThreatCenterPage from './pages/ThreatCenterPage';
import AnimatedBackground from './components/AnimatedBackground';
import ThreatHuntingPage from './pages/ThreatHuntingPage';
import PenetrationTestingPage from './pages/PenetrationTestingPage';
import VirtualSocWorkbenchPage from './pages/VirtualSocWorkbenchPage';


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-transparent font-sans">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(prev => !prev)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
                <div className="container mx-auto px-6 py-8">
                    {children}
                </div>
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const analystRoles = [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst];
  
  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-account" element={<VerifyAccountPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            
            {/* Protected Routes */}
            <Route path="/search" element={
              <ProtectedRoute>
                <AppLayout>
                  <SearchPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/threat-center" element={
              <ProtectedRoute roles={analystRoles}>
                <AppLayout>
                  <ThreatCenterPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/threat-hunting" element={
              <ProtectedRoute roles={analystRoles}>
                <AppLayout>
                  <ThreatHuntingPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/audit-log" element={
              <ProtectedRoute>
                <AppLayout>
                  <AuditLogPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/user-management" element={
              <ProtectedRoute roles={[Role.Admin]}>
                <AppLayout>
                  <UserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/log-ingestion" element={
              <ProtectedRoute roles={[Role.Admin, Role.SecurityManager, Role.SeniorAnalyst]}>
                <AppLayout>
                  <LogUploadPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/investigations" element={
              <ProtectedRoute roles={analystRoles}>
                <AppLayout>
                  <InvestigationListPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/investigation/:investigationId" element={
              <ProtectedRoute roles={analystRoles}>
                <AppLayout>
                  <InvestigationWorkbenchPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/inbox" element={
              <ProtectedRoute>
                <AppLayout>
                  <InboxPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/calendar" element={
              <ProtectedRoute>
                <AppLayout>
                  <CalendarPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/sops" element={
              <ProtectedRoute>
                <AppLayout>
                  <SopPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/tools" element={
              <ProtectedRoute>
                <AppLayout>
                  <ToolsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/behavioral-analytics" element={
              <ProtectedRoute roles={[Role.Admin, Role.SecurityManager, Role.SeniorAnalyst]}>
                <AppLayout>
                  <BehavioralAnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
             <Route path="/penetration-testing" element={
                <ProtectedRoute roles={[Role.Admin, Role.SecurityManager, Role.SeniorAnalyst]}>
                    <AppLayout>
                        <PenetrationTestingPage />
                    </AppLayout>
                </ProtectedRoute>
             } />
             <Route path="/virtual-soc-workbench" element={
                <ProtectedRoute roles={analystRoles}>
                    <AppLayout>
                        <VirtualSocWorkbenchPage />
                    </AppLayout>
                </ProtectedRoute>
             } />
            <Route path="/drone-security" element={
              <ProtectedRoute roles={[Role.Admin, Role.SecurityManager]}>
                <AppLayout>
                  <DroneSecurityPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/platform-security" element={
              <ProtectedRoute roles={[Role.Admin, Role.SecurityManager]}>
                <AppLayout>
                  <PlatformSecurityPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/search" />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;