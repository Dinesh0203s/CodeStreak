import { Link } from 'react-router-dom';
import { Flame, LayoutDashboard, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { ProfileMenu } from './ProfileMenu';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative">
            <Flame className="h-8 w-8 text-streak animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-streak opacity-50" />
          </div>
          <span className="text-2xl font-bold bg-gradient-streak bg-clip-text text-transparent">
            CodeStreak
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <nav className="hidden md:flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/reminder">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Reminder
                </Button>
              </Link>
            </nav>
          )}
          <ThemeToggle />
          {user ? (
            <ProfileMenu />
          ) : (
            <Link to="/auth">
              <Button variant="default" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
