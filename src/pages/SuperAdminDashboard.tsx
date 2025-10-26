import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Building2,
  Users, 
  TrendingUp, 
  Award, 
  Search,
  Download,
  Shield,
  Flame,
  BarChart3,
  Plus,
  Trash2,
  Ban,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getColleges, createCollege, deleteCollege, banCollege, getOverallLeaderboard, College } from '@/lib/api';
import { toast } from 'sonner';

const SuperAdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({
    name: '',
    location: '',
    departments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Calculate real stats from colleges
  const globalStats = {
    totalColleges: colleges.length,
    totalStudents: colleges.reduce((sum, c) => sum + (c.studentCount || 0), 0),
    activeStudents: 0, // TODO: Calculate from submissions
    avgStreak: 0, // TODO: Calculate from user stats
  };

  useEffect(() => {
    fetchColleges();
    fetchTopPerformers();
  }, []);

  const fetchTopPerformers = async () => {
    try {
      setStatsLoading(true);
      const performers = await getOverallLeaderboard(5);
      setTopPerformers(performers);
    } catch (error: any) {
      console.error('Failed to fetch top performers:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const data = await getColleges();
      setColleges(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollege = async () => {
    if (!newCollege.name.trim()) {
      toast.error('College name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const departments = newCollege.departments
        ? newCollege.departments.split(',').map(d => d.trim()).filter(d => d)
        : [];
      
      await createCollege({
        name: newCollege.name.trim(),
        location: newCollege.location.trim() || undefined,
        departments,
      });
      
      toast.success('College added successfully!');
      setIsAddDialogOpen(false);
      setNewCollege({ name: '', location: '', departments: '' });
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add college');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollege = async (collegeId: string, collegeName: string) => {
    try {
      await deleteCollege(collegeId);
      toast.success(`College "${collegeName}" deleted successfully`);
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete college');
    }
  };

  const handleBanCollege = async (collegeId: string, isBanned: boolean, collegeName: string) => {
    try {
      await banCollege(collegeId, isBanned);
      toast.success(`College "${collegeName}" ${isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchColleges();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update college status');
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Platform-wide analytics and management</p>
          </div>
          <Button className="bg-gradient-streak border-0 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export Global Report
          </Button>
        </div>

        {/* Global Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">{globalStats.totalColleges}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Colleges</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-success/5">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-success" />
              <span className="text-2xl font-bold">{globalStats.totalStudents.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-streak/5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-streak" />
              <span className="text-2xl font-bold">{globalStats.activeStudents.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Active Students</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-challenge/5">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-8 w-8 text-challenge" />
              <span className="text-2xl font-bold">{globalStats.avgStreak}</span>
            </div>
            <p className="text-sm text-muted-foreground">Global Avg Streak</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Top Performers */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-challenge" />
              <h2 className="text-xl font-semibold">Top Performers</h2>
            </div>
            <div className="space-y-3">
              {statsLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
              ) : topPerformers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No performers yet</div>
              ) : (
                topPerformers.map((performer) => (
                <div key={performer.rank} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    performer.rank === 1 ? 'bg-yellow-500 text-white' :
                    performer.rank === 2 ? 'bg-gray-400 text-white' :
                    performer.rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-muted text-foreground'
                  }`}>
                    {performer.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{performer.name}</div>
                    <div className="text-xs text-muted-foreground">{performer.college}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-streak font-semibold text-sm">
                      <Flame className="h-3 w-3" />
                      {performer.streak}
                    </div>
                    <div className="text-xs text-muted-foreground">{performer.solved} solved</div>
                  </div>
                </div>
                ))
              )}
            </div>
          </Card>

          {/* Platform Analytics */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Platform Growth</h2>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                const height = [45, 60, 55, 75, 85, 90][i];
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full space-y-1">
                      <div
                        className="w-full rounded-t-lg bg-gradient-streak"
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-center text-xs font-semibold">{[1200, 2400, 3100, 5200, 8900, 12450][i]}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{month}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Tabs for Different Management Sections */}
        <Card className="p-6">
          <Tabs defaultValue="colleges">
            <TabsList className="mb-6">
              <TabsTrigger value="colleges">College Management</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="roles">Role Management</TabsTrigger>
              <TabsTrigger value="departments">Department Management</TabsTrigger>
            </TabsList>

            {/* College Management Tab */}
            <TabsContent value="colleges">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">College Management</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search colleges..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-streak border-0 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Add College
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New College</DialogTitle>
                        <DialogDescription>
                          Add a new college to the system. Fill in the required information.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">College Name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g., MIT College of Engineering"
                            value={newCollege.name}
                            onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="e.g., Pune, Maharashtra"
                            value={newCollege.location}
                            onChange={(e) => setNewCollege({ ...newCollege, location: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departments">Departments (comma-separated)</Label>
                          <Input
                            id="departments"
                            placeholder="e.g., Computer Science, Information Technology, Electronics"
                            value={newCollege.departments}
                            onChange={(e) => setNewCollege({ ...newCollege, departments: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false);
                            setNewCollege({ name: '', location: '', departments: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddCollege}
                          disabled={isSubmitting}
                          className="bg-gradient-streak border-0 text-white"
                        >
                          {isSubmitting ? 'Adding...' : 'Add College'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading colleges...</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>College Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Departments</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredColleges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No colleges found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredColleges.map((college) => (
                          <TableRow key={college._id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {college.name}
                              </div>
                            </TableCell>
                            <TableCell>{college.location || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {college.departments && college.departments.length > 0 ? (
                                  college.departments.slice(0, 2).map((dept, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted"
                                    >
                                      {dept}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                                {college.departments && college.departments.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{college.departments.length - 2} more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{college.studentCount || 0}</TableCell>
                            <TableCell>
                              {college.isBanned ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                  <Ban className="mr-1 h-3 w-3" />
                                  Banned
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {college._id && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleBanCollege(college._id!, !college.isBanned, college.name)}
                                      title={college.isBanned ? 'Unban College' : 'Ban College'}
                                    >
                                      <Ban className={`h-4 w-4 ${college.isBanned ? 'text-success' : 'text-destructive'}`} />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete College</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{college.name}"? This action cannot be undone.
                                            {college.studentCount && college.studentCount > 0 && (
                                              <span className="block mt-2 text-destructive font-medium">
                                                Warning: This college has {college.studentCount} students.
                                              </span>
                                            )}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => college._id && handleDeleteCollege(college._id, college.name)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Button className="bg-gradient-streak border-0 text-white">
                  Add New User
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: 1, name: 'Raj Patel', email: 'raj@iitb.ac.in', college: 'IIT Bombay', role: 'Admin', status: 'Active' },
                      { id: 2, name: 'Sarah Khan', email: 'sarah@bits.edu', college: 'BITS Pilani', role: 'Admin', status: 'Active' },
                      { id: 3, name: 'Alice Johnson', email: 'alice@mit.edu', college: 'MIT College', role: 'User', status: 'Active' },
                      { id: 4, name: 'John Doe', email: 'john@vit.ac.in', college: 'VIT Vellore', role: 'User', status: 'Inactive' },
                    ].map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>{user.college}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'Admin' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Role Management Tab */}
            <TabsContent value="roles">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Role Management</h2>
                <Button className="bg-gradient-streak border-0 text-white">
                  Assign Role
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { role: 'Super Admin', count: 2, color: 'primary', permissions: ['Full System Access', 'Manage All Colleges', 'Role Assignment'] },
                  { role: 'College Admin', count: 45, color: 'success', permissions: ['Manage College', 'View Students', 'Export Reports'] },
                  { role: 'User', count: 12450, color: 'muted', permissions: ['Track Streak', 'View Leaderboard', 'Connect Friends'] },
                ].map((roleInfo) => (
                  <Card key={roleInfo.role} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{roleInfo.role}</h3>
                      <span className="text-2xl font-bold">{roleInfo.count}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">Permissions:</p>
                      <ul className="text-sm space-y-1">
                        {roleInfo.permissions.map((perm) => (
                          <li key={perm} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-success" />
                            {perm}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      Manage Users
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Department Management Tab */}
            <TabsContent value="departments">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Department Management</h2>
              </div>

              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Department management feature coming soon.</p>
                <p className="text-sm mt-2">Departments are managed through college records.</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
