import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FarmerDashboard from './pages/FarmerDashboard';
import WholesalerDashboard from './pages/WholesalerDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <div>Unauthorized</div>;

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role.toLowerCase()}`} /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={`/${user.role.toLowerCase()}`} /> : <Signup />} />
      
      <Route path="/farmer/*" element={
        <ProtectedRoute allowedRoles={['FARMER']}>
          <FarmerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/wholesaler/*" element={
        <ProtectedRoute allowedRoles={['WHOLESALER']}>
          <WholesalerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/retailer/*" element={
        <ProtectedRoute allowedRoles={['RETAILER']}>
          <RetailerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
