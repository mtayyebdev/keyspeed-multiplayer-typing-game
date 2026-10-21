import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isInitialized, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-bg text-fg">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Security check: only admin role allowed
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Banned users rejected
  if (user?.isBanned) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

