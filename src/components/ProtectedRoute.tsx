import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByFirebaseUid } from '@/lib/api';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRegularUser?: boolean; // If true, redirect admins away
  requireAdmin?: boolean; // If true, only allow admin or superAdmin
  requireSuperAdmin?: boolean; // If true, only allow superAdmin
  requireDeptAdmin?: boolean; // If true, only allow deptAdmin
}

export const ProtectedRoute = ({ 
  children, 
  requireRegularUser = false,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireDeptAdmin = false,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (loading) return;

      if (!user) {
        navigate('/auth');
        setCheckingRole(false);
        return;
      }

      try {
        const userData = await getUserByFirebaseUid(user.uid);
        const role = userData.role || 'user';
        
        // Check role requirements first (most restrictive)
        if (requireSuperAdmin) {
          if (role !== 'superAdmin') {
            toast.error('Access denied. Super Admin privileges required.');
            navigate('/dashboard');
            setCheckingRole(false);
            return;
          }
        } else if (requireAdmin) {
          if (role !== 'admin' && role !== 'superAdmin') {
            toast.error('Access denied. Admin privileges required.');
            navigate('/dashboard');
            setCheckingRole(false);
            return;
          }
        } else if (requireDeptAdmin) {
          if (role !== 'deptAdmin' && role !== 'admin' && role !== 'superAdmin') {
            toast.error('Access denied. Department Admin privileges required.');
            navigate('/dashboard');
            setCheckingRole(false);
            return;
          }
        }
        
        // Check if user has completed onboarding (unless they're an admin/superAdmin)
        // Only check onboarding for regular users (not admins, superAdmins, or deptAdmins)
        // User is considered onboarded if:
        // 1. isOnboarded is explicitly true, OR
        // 2. They have both fullName and college (backward compatibility)
        if (role === 'user') {
          const isOnboarded = userData.isOnboarded === true || (!!userData.fullName && !!userData.college);
          if (!isOnboarded) {
            navigate('/onboarding');
            setCheckingRole(false);
            return;
          }
        }

        if (requireRegularUser) {
          if (role === 'superAdmin') {
            navigate('/super-admin');
            return;
          } else if (role === 'admin') {
            navigate('/admin');
            return;
          } else if (role === 'deptAdmin') {
            navigate('/dept-admin');
            return;
          }
        }
      } catch (error: any) {
        // User might not exist yet, redirect to onboarding
        console.log('User data not found, redirecting to onboarding:', error.message);
        navigate('/onboarding');
        setCheckingRole(false);
        return;
      }

      setCheckingRole(false);
    };

    checkUserRole();
  }, [user, loading, navigate, requireRegularUser, requireAdmin, requireSuperAdmin, requireDeptAdmin]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-streak mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

