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
      } catch (error: any) {
        // User might not exist in MongoDB yet
        console.log('User data not found:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superAdmin';
  const isSuperAdmin = userData?.role === 'superAdmin';
  const isRegularUser = !isAdmin;

  return {
    userData,
    role: userData?.role || 'user',
    isAdmin,
    isSuperAdmin,
    isRegularUser,
    loading,
  };
};

