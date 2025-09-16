import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetForm from './components/assets/AssetForm';
import UsersPage from './pages/UsersPage';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const hasRequiredRole = roles.length === 0 || (user && roles.includes(user.role));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute roles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/assets/new" 
        element={
          <ProtectedRoute roles={['admin', 'commander']}>
            <AssetForm />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/assets/:id" 
        element={
          <ProtectedRoute>
            <AssetDetailPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/assets/edit/:id" 
        element={
          <ProtectedRoute roles={['admin', 'commander']}>
            <AssetForm isEdit />
          </ProtectedRoute>
        } 
      />
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              404 - Page Not Found
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
          </Container>
        } 
      />
    </Routes>
  );
}

export default App;
