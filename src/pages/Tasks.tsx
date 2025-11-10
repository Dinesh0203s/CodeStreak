import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTasks, updateTaskCompletion, Task } from '@/lib/api';
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
  isUpdating: boolean;
}

const TaskCard = ({ task, onToggleComplete, isUpdating }: TaskCardProps) => {
  return (
    <Card className={`p-6 ${task.isCompleted ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <Checkbox
            checked={task.isCompleted}
            onCheckedChange={onToggleComplete}
            disabled={isUpdating}
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className={`text-lg font-semibold ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
            {task.isCompleted && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                Completed
              </span>
            )}
          </div>
          {task.description && (
            <p className={`text-sm text-muted-foreground mb-4 ${task.isCompleted ? 'line-through' : ''}`}>
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(task.link, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Link
            </Button>
            {task.completedAt && (
              <span className="text-xs text-muted-foreground">
                Completed on {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Tasks;

