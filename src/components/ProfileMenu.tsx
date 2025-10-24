import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByFirebaseUid, User } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Settings, Shield, LogOut, Crown } from 'lucide-react';
import { toast } from 'sonner';

export const ProfileMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
        // User might not exist in MongoDB yet, that's okay
        console.log('User data not found in MongoDB:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superAdmin';
  const isSuperAdmin = userData?.role === 'superAdmin';

  if (!user) return null;

  const displayName = userData?.fullName || user.displayName || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-muted/50 p-1 transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || undefined} alt={displayName} />
            <AvatarFallback className="bg-gradient-streak text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayName}</span>
            {isSuperAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
            {isAdmin && !isSuperAdmin && <Shield className="h-4 w-4 text-blue-500" />}
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            {userData?.email || user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(isSuperAdmin ? '/super-admin' : '/admin')}
            >
              <Shield className="mr-2 h-4 w-4" />
              {isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

