import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByFirebaseUid, User } from '@/lib/api';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserByFirebaseUid(user.uid);
        setUserData(data);
      } catch (error: unknown) {
        // User might not exist in MongoDB yet
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (import.meta.env.DEV) {
          console.log('User data not found:', errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superAdmin' || userData?.role === 'deptAdmin';
  const isSuperAdmin = userData?.role === 'superAdmin';
  const isDeptAdmin = userData?.role === 'deptAdmin';
  const isRegularUser = !isAdmin;

  return {
    userData,
    role: userData?.role || 'user',
    isAdmin,
    isSuperAdmin,
    isDeptAdmin,
    isRegularUser,
    loading,
  };
};

