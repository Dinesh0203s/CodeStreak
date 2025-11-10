import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTasks, updateTaskCompletion, updateLinkCompletion, Task } from '@/lib/api';
import { toast } from 'sonner';

const Tasks = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      return;
    }

    fetchTasks();
  }, [user, authLoading]);

  const fetchTasks = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userTasks = await getUserTasks(user.uid);
      setTasks(userTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!user?.uid || !task._id) return;

    try {
      setUpdatingTaskId(task._id);
      const updatedTask = await updateTaskCompletion(task._id, user.uid, !task.isCompleted);
      
      setTasks(prevTasks =>
        prevTasks.map(t => t._id === task._id ? updatedTask : t)
      );
      
      toast.success(updatedTask.isCompleted ? 'Task marked as completed!' : 'Task marked as incomplete');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleToggleLinkComplete = async (task: Task, link: string) => {
    if (!user?.uid || !task._id) return;

    try {
      setUpdatingTaskId(task._id);
      
      // Get current completion status for this link
      const linkCompletion = task.linkCompletion?.find(lc => lc.link === link);
      const isCurrentlyCompleted = linkCompletion?.isCompleted || false;
      
      const updatedTask = await updateLinkCompletion(task._id, user.uid, link, !isCurrentlyCompleted);
      
      setTasks(prevTasks =>
        prevTasks.map(t => t._id === task._id ? updatedTask : t)
      );
      
      toast.success(!isCurrentlyCompleted ? 'Link marked as completed!' : 'Link marked as incomplete');
    } catch (error: any) {
      console.error('Error updating link completion:', error);
      toast.error(error.message || 'Failed to update link completion');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const completedTasks = tasks.filter(task => task.isCompleted);
  const pendingTasks = tasks.filter(task => !task.isCompleted);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <div>Loading tasks...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
          <p className="text-muted-foreground">View and manage your assigned tasks</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({tasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <Circle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending tasks</p>
              </Card>
            ) : (
              pendingTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggleComplete={() => handleToggleComplete(task)}
                  onToggleLinkComplete={(link) => handleToggleLinkComplete(task, link)}
                  isUpdating={updatingTaskId === task._id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No completed tasks</p>
              </Card>
            ) : (
              completedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggleComplete={() => handleToggleComplete(task)}
                  onToggleLinkComplete={(link) => handleToggleLinkComplete(task, link)}
                  isUpdating={updatingTaskId === task._id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {tasks.length === 0 ? (
              <Card className="p-8 text-center">
                <Circle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tasks assigned</p>
              </Card>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onToggleComplete={() => handleToggleComplete(task)}
                  onToggleLinkComplete={(link) => handleToggleLinkComplete(task, link)}
                  isUpdating={updatingTaskId === task._id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onToggleLinkComplete: (link: string) => void;
  isUpdating: boolean;
}

const TaskCard = ({ task, onToggleComplete, onToggleLinkComplete, isUpdating }: TaskCardProps) => {
  // Support both old format (single link) and new format (multiple links)
  const links = task.links && task.links.length > 0 
    ? task.links 
    : (task.link ? [task.link] : []);

  // Get completion status for each link
  const getLinkCompletion = (link: string) => {
    if (!task.linkCompletion || task.linkCompletion.length === 0) {
      return { isCompleted: false, completedAt: undefined };
    }
    const completion = task.linkCompletion.find(lc => lc.link === link);
    return completion || { isCompleted: false, completedAt: undefined };
  };

  const allLinksCompleted = links.every(link => getLinkCompletion(link).isCompleted);

  return (
    <Card className={`p-6 ${allLinksCompleted ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <Checkbox
            checked={allLinksCompleted}
            onCheckedChange={onToggleComplete}
            disabled={isUpdating}
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className={`text-lg font-semibold ${allLinksCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
            {allLinksCompleted && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                All Links Completed
              </span>
            )}
          </div>
          {task.description && (
            <p className={`text-sm text-muted-foreground mb-4 ${allLinksCompleted ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}
          <div className="space-y-3">
            <div className="space-y-2">
              {links.map((link, index) => {
                const linkCompletion = getLinkCompletion(link);
                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                    <Checkbox
                      checked={linkCompletion.isCompleted}
                      onCheckedChange={() => onToggleLinkComplete(link)}
                      disabled={isUpdating}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(link, '_blank')}
                        className="flex items-center gap-2 h-auto p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm">
                          Link {links.length > 1 ? index + 1 : ''}
                        </span>
                      </Button>
                      {linkCompletion.isCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {task.completedAt && (
              <span className="text-xs text-muted-foreground">
                All links completed on {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Tasks;

