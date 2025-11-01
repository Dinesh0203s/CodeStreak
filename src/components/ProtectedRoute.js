import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but hasn't completed onboarding
  if (currentUser && userProfile && userProfile.isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is logged in but userProfile is null (database issue), allow access to dashboard
  if (currentUser && !userProfile) {
    return children;
  }

  return children;
};

export default ProtectedRoute;
