import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();

  if (auth.loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return auth.isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
