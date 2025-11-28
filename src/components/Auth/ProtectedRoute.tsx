import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresUserType?: 'client' | 'provider';
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiresAuth = true,
  requiresUserType,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileCheckTimeout, setProfileCheckTimeout] = useState(false);

  // Set a timeout for profile loading to prevent infinite loops
  useEffect(() => {
    if (user && !user.profile && location.pathname !== '/profile') {
      const timer = setTimeout(() => {
        console.warn('Profile loading timeout - allowing access without complete profile');
        setProfileCheckTimeout(true);
      }, 2000); // 2 second timeout (ridotto da 5)

      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Caricamento...
          </h2>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requiresAuth && !user) {
    // Redirect to login page with return URL
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if specific user type is required
  if (requiresUserType && user && user.user_type !== requiresUserType) {
    // Redirect to appropriate dashboard based on user type
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user profile is complete (with timeout protection)
  // TEMPORANEAMENTE DISABILITATO PER DEBUG
  if (false && requiresAuth && user && !user.profile && !profileCheckTimeout) {
    console.log('🔍 ProtectedRoute: User without profile detected', {
      userId: user.id,
      userType: user.user_type,
      hasProfile: !!user.profile,
      currentPath: location.pathname,
      profileCheckTimeout
    });
    
    // Skip redirect for profile pages and dashboard to avoid loops
    const isProfilePage = location.pathname === '/profile' || 
                         location.pathname === '/client/profile' || 
                         location.pathname === '/provider/profile';
    
    const isDashboard = location.pathname === '/dashboard';
    
    // Allow access to dashboard even without complete profile (profile loads asynchronously)
    if (!isProfilePage && !isDashboard) {
      // Redirect to appropriate profile page based on user type
      const profilePath = user.user_type === 'client' ? '/client/profile' : '/provider/profile';
      console.log('🔄 ProtectedRoute: Redirecting to profile page:', profilePath);
      return <Navigate to={profilePath} state={{ message: 'Completa il tuo profilo per continuare' }} replace />;
    }
  }
  
  console.log('🟢 ProtectedRoute: Allowing access to', location.pathname, {
    user: !!user,
    hasProfile: !!user?.profile,
    userType: user?.user_type
  });

  // All checks passed, render the protected component
  return <>{children}</>;
}