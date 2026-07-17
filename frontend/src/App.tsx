import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Verification } from './pages/Verification';
import { VoterDashboard } from './pages/VoterDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { VerifyReceipt } from './pages/VerifyReceipt';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

// Route Guard component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: Array<'Admin' | 'Election Officer' | 'Candidate' | 'Voter'> 
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-darkBlue-950">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this portal, bounce to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-darkBlue-950 dark:text-slate-100 transition-colors duration-200">
        <Navbar />
        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/verify-receipt" element={<VerifyReceipt />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Voter routes */}
            <Route 
              path="/voter" 
              element={
                <ProtectedRoute allowedRoles={['Voter', 'Admin']}>
                  <VoterDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Candidate routes */}
            <Route 
              path="/candidate" 
              element={
                <ProtectedRoute allowedRoles={['Candidate', 'Admin']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin/Officer routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Election Officer']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
