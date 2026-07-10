import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Clients from './pages/Clients';
import Employees from './pages/Employees';
import History from './pages/History';
import Reports from './pages/Reports';
import Users from './pages/Users';

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="clients" element={
              <PrivateRoute roles={['admin', 'supervisor']}>
                <Clients />
              </PrivateRoute>
            } />
            <Route path="employees" element={
              <PrivateRoute roles={['admin', 'supervisor']}>
                <Employees />
              </PrivateRoute>
            } />
            <Route path="history" element={<History />} />
            <Route path="reports" element={
              <PrivateRoute roles={['admin', 'supervisor']}>
                <Reports />
              </PrivateRoute>
            } />
            <Route path="users" element={
              <PrivateRoute roles={['admin']}>
                <Users />
              </PrivateRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;