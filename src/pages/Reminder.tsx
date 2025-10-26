import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Reminder = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8">
          <div className="text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Reminders</h1>
            <p className="text-muted-foreground mb-6">
              Set up reminders to keep your coding streak alive!
            </p>
            <p className="text-sm text-muted-foreground">
              This feature is coming soon. You'll be able to set up notifications via app, SMS, or calls.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reminder;

