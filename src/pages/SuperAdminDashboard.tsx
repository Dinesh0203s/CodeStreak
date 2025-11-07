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
  GraduationCap,
  Edit,
  UserCog,
  X
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
import { 
  getColleges, 
  createCollege, 
  deleteCollege, 
  banCollege, 
  getOverallLeaderboard, 
  getAllUsers,
  updateUserRole,
  banUser,
  adminUpdateUser,
  getCollegeDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  College,
  User
} from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const SuperAdminDashboard = () => {
  const { user: currentUser } = useAuth();
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
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userCollegeFilter, setUserCollegeFilter] = useState<string>('all');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    fullName: '',
    college: '',
    department: '',
    passoutYear: '',
    leetcodeHandle: '',
    codechefHandle: '',
    role: 'user' as 'user' | 'admin' | 'superAdmin',
  });

  // Department management state
  const [selectedCollegeForDept, setSelectedCollegeForDept] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<{ oldName: string; newName: string } | null>(null);

  // Role management state
  const [roleManagementUsers, setRoleManagementUsers] = useState<User[]>([]);
  const [roleManagementLoading, setRoleManagementLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [rolePage, setRolePage] = useState(1);
  const [roleTotalPages, setRoleTotalPages] = useState(1);
  const [isRoleAssignmentDialogOpen, setIsRoleAssignmentDialogOpen] = useState(false);
  const [roleAssignmentUser, setRoleAssignmentUser] = useState<User | null>(null);
  const [roleAssignmentData, setRoleAssignmentData] = useState({
    role: 'user' as 'user' | 'admin' | 'superAdmin' | 'deptAdmin',
    college: '',
    department: '',
  });

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
    fetchUsers();
  }, [userPage, userRoleFilter, userCollegeFilter]);

  useEffect(() => {
    if (selectedCollegeForDept) {
      fetchDepartments(selectedCollegeForDept);
    } else {
      setDepartments([]);
    }
  }, [selectedCollegeForDept]);

  useEffect(() => {
    fetchRoleManagementUsers();
  }, [rolePage, roleFilter, roleSearchQuery]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (rolePage === 1) {
        fetchRoleManagementUsers();
      } else {
        setRolePage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [roleSearchQuery]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (userPage === 1) {
        fetchUsers();
      } else {
        setUserPage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery]);

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

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params: any = {
        page: userPage,
        limit: 20,
      };
      if (userSearchQuery) params.search = userSearchQuery;
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      if (userCollegeFilter !== 'all') params.college = userCollegeFilter;

      const data = await getAllUsers(params);
      setUsers(data.users);
      setUserTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      fullName: user.fullName || '',
      college: user.college || '',
      department: user.department || '',
      passoutYear: user.passoutYear || '',
      leetcodeHandle: user.leetcodeHandle || '',
      codechefHandle: user.codechefHandle || '',
      role: user.role || 'user',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // If role is admin, college is required
    if (editUserData.role === 'admin' && !editUserData.college) {
      toast.error('College is required when role is admin');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminUpdateUser(editingUser.firebaseUid, editUserData);
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    user: User | null;
    newRole: 'user' | 'admin' | 'superAdmin' | null;
    selectedCollege: string;
  }>({
    open: false,
    user: null,
    newRole: null,
    selectedCollege: '',
  });

  const handleUpdateRole = async (firebaseUid: string, newRole: 'user' | 'admin' | 'superAdmin', user: User) => {
    // If changing to admin, require college selection
    if (newRole === 'admin') {
      setRoleChangeDialog({
        open: true,
        user,
        newRole,
        selectedCollege: user.college || '',
      });
      return;
    }

    // For other roles, update directly
    try {
      await updateUserRole(firebaseUid, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeDialog.user || !roleChangeDialog.newRole) return;

    // If changing to admin, college is required
    if (roleChangeDialog.newRole === 'admin' && !roleChangeDialog.selectedCollege) {
      toast.error('Please select a college for the admin');
      return;
    }

    try {
      await updateUserRole(
        roleChangeDialog.user.firebaseUid,
        roleChangeDialog.newRole,
        roleChangeDialog.selectedCollege || undefined
      );
      toast.success('User role updated successfully');
      setRoleChangeDialog({ open: false, user: null, newRole: null, selectedCollege: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleBanUser = async (firebaseUid: string, isBanned: boolean, userName: string) => {
    try {
      await banUser(firebaseUid, isBanned);
      toast.success(`User "${userName}" ${isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  // Department management functions
  const fetchDepartments = async (collegeName: string) => {
    try {
      setDepartmentsLoading(true);
      const depts = await getCollegeDepartments(collegeName);
      setDepartments(depts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      toast.error('Department name is required');
      return;
    }

    if (!selectedCollegeForDept) {
      toast.error('Please select a college first');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDepartment(selectedCollegeForDept, newDepartment.trim());
      toast.success('Department added successfully');
      setNewDepartment('');
      setIsAddDeptDialogOpen(false);
      await fetchDepartments(selectedCollegeForDept);
      await fetchColleges(); // Refresh college data
    } catch (error: any) {
      toast.error(error.message || 'Failed to add department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!editingDepartment || !editingDepartment.newName.trim()) {
      toast.error('Department name is required');
      return;
    }

    if (!selectedCollegeForDept) {
      toast.error('College selection is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDepartment(selectedCollegeForDept, editingDepartment.oldName, editingDepartment.newName.trim());
      toast.success('Department updated successfully');
      setEditingDepartment(null);
      setIsEditDeptDialogOpen(false);
      await fetchDepartments(selectedCollegeForDept);
      await fetchColleges(); // Refresh college data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!selectedCollegeForDept) {
      toast.error('College selection is missing');
      return;
    }

    try {
      await deleteDepartment(selectedCollegeForDept, departmentName);
      toast.success('Department deleted successfully');
      await fetchDepartments(selectedCollegeForDept);
      await fetchColleges(); // Refresh college data
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    }
  };

  // Role management functions
  const fetchRoleManagementUsers = async () => {
    try {
      setRoleManagementLoading(true);
      const params: any = {
        page: rolePage,
        limit: 20,
      };
      if (roleSearchQuery) params.search = roleSearchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;

      const data = await getAllUsers(params);
      setRoleManagementUsers(data.users);
      setRoleTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setRoleManagementLoading(false);
    }
  };

  const calculateRoleStats = () => {
    const stats = {
      superAdmin: 0,
      admin: 0,
      deptAdmin: 0,
      user: 0,
    };

    // Calculate from all users (we'll fetch a larger sample)
    roleManagementUsers.forEach(user => {
      const role = user.role || 'user';
      if (role === 'superAdmin') stats.superAdmin++;
      else if (role === 'admin') stats.admin++;
      else if (role === 'deptAdmin') stats.deptAdmin++;
      else stats.user++;
    });

    // For accurate counts, we should fetch all users, but for now use the current page
    // In production, you might want to add a separate endpoint for role counts
    return stats;
  };

  const handleAssignRole = (user: User) => {
    setRoleAssignmentUser(user);
    setRoleAssignmentData({
      role: (user.role as 'user' | 'admin' | 'superAdmin' | 'deptAdmin') || 'user',
      college: user.college || '',
      department: user.department || '',
    });
    setIsRoleAssignmentDialogOpen(true);
  };

  const handleSaveRoleAssignment = async () => {
    if (!roleAssignmentUser) return;

    // Validation
    if (roleAssignmentData.role === 'admin' && !roleAssignmentData.college) {
      toast.error('College is required for admin role');
      return;
    }

    if (roleAssignmentData.role === 'deptAdmin' && (!roleAssignmentData.college || !roleAssignmentData.department)) {
      toast.error('College and department are required for department admin role');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserRole(
        roleAssignmentUser.firebaseUid,
        roleAssignmentData.role,
        roleAssignmentData.college || undefined,
        roleAssignmentData.department || undefined
      );
      toast.success('Role assigned successfully');
      setIsRoleAssignmentDialogOpen(false);
      setRoleAssignmentUser(null);
      fetchRoleManagementUsers();
      fetchUsers(); // Refresh user management tab as well
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign role');
    } finally {
      setIsSubmitting(false);
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
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">User Management</h2>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userCollegeFilter} onValueChange={setUserCollegeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colleges</SelectItem>
                      {colleges.map((college) => (
                        <SelectItem key={college._id} value={college.name}>
                          {college.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>College</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user._id || user.firebaseUid}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {user.photoURL && (
                                    <img 
                                      src={user.photoURL} 
                                      alt={user.displayName}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <div>{user.fullName || user.displayName}</div>
                                    {user.currentStreak !== undefined && (
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Flame className="h-3 w-3 text-streak" />
                                        {user.currentStreak} day streak
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              <TableCell>{user.college || '-'}</TableCell>
                              <TableCell>{user.department || '-'}</TableCell>
                              <TableCell>
                                <Select
                                  value={user.role || 'user'}
                                  onValueChange={(value) => {
                                    if (user.firebaseUid !== currentUser?.uid) {
                                      handleUpdateRole(user.firebaseUid, value as 'user' | 'admin' | 'superAdmin', user);
                                    } else {
                                      toast.error('Cannot change your own role');
                                    }
                                  }}
                                  disabled={user.firebaseUid === currentUser?.uid}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superAdmin">Super Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {user.isBanned ? (
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    title="Edit user"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBanUser(user.firebaseUid, !user.isBanned, user.fullName || user.displayName)}
                                    title={user.isBanned ? 'Unban user' : 'Ban user'}
                                    disabled={user.firebaseUid === currentUser?.uid}
                                  >
                                    <Ban className={`h-4 w-4 ${user.isBanned ? 'text-success' : 'text-destructive'}`} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {userTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {userPage} of {userTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.max(1, p - 1))}
                          disabled={userPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                          disabled={userPage === userTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Edit User Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information. Changes will be saved immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-fullName">Full Name</Label>
                        <Input
                          id="edit-fullName"
                          value={editUserData.fullName}
                          onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-college">
                          College {editUserData.role === 'admin' && '*'}
                        </Label>
                        {editUserData.role === 'admin' ? (
                          <Select
                            value={editUserData.college}
                            onValueChange={(value) => setEditUserData({ ...editUserData, college: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a college (required for admin)" />
                            </SelectTrigger>
                            <SelectContent>
                              {colleges.map((college) => (
                                <SelectItem key={college._id} value={college.name}>
                                  {college.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="edit-college"
                            value={editUserData.college}
                            onChange={(e) => setEditUserData({ ...editUserData, college: e.target.value })}
                            placeholder="College name"
                          />
                        )}
                        {editUserData.role === 'admin' && (
                          <p className="text-xs text-muted-foreground">
                            Admins must be assigned to one college only
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-department">Department</Label>
                        <Input
                          id="edit-department"
                          value={editUserData.department}
                          onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-passoutYear">Passout Year</Label>
                        <Input
                          id="edit-passoutYear"
                          value={editUserData.passoutYear}
                          onChange={(e) => setEditUserData({ ...editUserData, passoutYear: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-leetcodeHandle">LeetCode Handle</Label>
                        <Input
                          id="edit-leetcodeHandle"
                          value={editUserData.leetcodeHandle}
                          onChange={(e) => setEditUserData({ ...editUserData, leetcodeHandle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-codechefHandle">CodeChef Handle</Label>
                        <Input
                          id="edit-codechefHandle"
                          value={editUserData.codechefHandle}
                          onChange={(e) => setEditUserData({ ...editUserData, codechefHandle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          value={editUserData.role}
                          onValueChange={(value) => setEditUserData({ ...editUserData, role: value as 'user' | 'admin' | 'superAdmin' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superAdmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveUser}
                      disabled={isSubmitting}
                      className="bg-gradient-streak border-0 text-white"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Role Change Dialog - For Admin Assignment */}
              <Dialog open={roleChangeDialog.open} onOpenChange={(open) => {
                if (!open) {
                  setRoleChangeDialog({ open: false, user: null, newRole: null, selectedCollege: '' });
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Admin Role</DialogTitle>
                    <DialogDescription>
                      Please select a college for this admin. Admins can only manage their assigned college.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-college">College *</Label>
                      <Select
                        value={roleChangeDialog.selectedCollege}
                        onValueChange={(value) => setRoleChangeDialog({ ...roleChangeDialog, selectedCollege: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a college" />
                        </SelectTrigger>
                        <SelectContent>
                          {colleges.map((college) => (
                            <SelectItem key={college._id} value={college.name}>
                              {college.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This admin will only be able to view and manage data for the selected college.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setRoleChangeDialog({ open: false, user: null, newRole: null, selectedCollege: '' })}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmRoleChange}
                      disabled={!roleChangeDialog.selectedCollege}
                      className="bg-gradient-streak border-0 text-white"
                    >
                      Assign Admin Role
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Role Management Tab */}
            <TabsContent value="roles">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Role Management</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assign and manage user roles across the platform
                  </p>
                </div>
              </div>

              {/* Role Statistics Cards */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">Super Admin</h3>
                    </div>
                    <span className="text-xl font-bold">{calculateRoleStats().superAdmin}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Full system access</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-success" />
                      <h3 className="font-semibold text-sm">College Admin</h3>
                    </div>
                    <span className="text-xl font-bold">{calculateRoleStats().admin}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Manage college</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-challenge" />
                      <h3 className="font-semibold text-sm">Dept Admin</h3>
                    </div>
                    <span className="text-xl font-bold">{calculateRoleStats().deptAdmin}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Manage department</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">Users</h3>
                    </div>
                    <span className="text-xl font-bold">{calculateRoleStats().user}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Regular users</p>
                </Card>
              </div>

              {/* Filters and Search */}
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                      <SelectItem value="admin">College Admin</SelectItem>
                      <SelectItem value="deptAdmin">Dept Admin</SelectItem>
                      <SelectItem value="user">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              {roleManagementLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>College</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Current Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleManagementUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          roleManagementUsers.map((user) => (
                            <TableRow key={user._id || user.firebaseUid}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {user.photoURL && (
                                    <img
                                      src={user.photoURL}
                                      alt={user.displayName}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <div>{user.fullName || user.displayName}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              <TableCell>{user.college || '-'}</TableCell>
                              <TableCell>{user.department || '-'}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'superAdmin' ? 'bg-primary/10 text-primary' :
                                  user.role === 'admin' ? 'bg-success/10 text-success' :
                                  user.role === 'deptAdmin' ? 'bg-challenge/10 text-challenge' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {user.role === 'superAdmin' ? 'Super Admin' :
                                   user.role === 'admin' ? 'College Admin' :
                                   user.role === 'deptAdmin' ? 'Dept Admin' :
                                   'User'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignRole(user)}
                                  title="Assign role"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {roleTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {rolePage} of {roleTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRolePage(p => Math.max(1, p - 1))}
                          disabled={rolePage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRolePage(p => Math.min(roleTotalPages, p + 1))}
                          disabled={rolePage === roleTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Role Assignment Dialog */}
              <Dialog open={isRoleAssignmentDialogOpen} onOpenChange={setIsRoleAssignmentDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Assign Role</DialogTitle>
                    <DialogDescription>
                      Assign or change role for {roleAssignmentUser?.fullName || roleAssignmentUser?.displayName || 'user'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-select">Role *</Label>
                      <Select
                        value={roleAssignmentData.role}
                        onValueChange={async (value) => {
                          const newRole = value as 'user' | 'admin' | 'superAdmin' | 'deptAdmin';
                          const newCollege = value === 'admin' || value === 'deptAdmin' ? roleAssignmentData.college : '';
                          
                          setRoleAssignmentData({
                            ...roleAssignmentData,
                            role: newRole,
                            college: newCollege,
                            department: value === 'deptAdmin' ? roleAssignmentData.department : '',
                          });

                          // If switching to deptAdmin and college is already selected, fetch departments
                          if (newRole === 'deptAdmin' && newCollege) {
                            try {
                              const depts = await getCollegeDepartments(newCollege);
                              setDepartments(depts);
                              setSelectedCollegeForDept(newCollege);
                            } catch (error: any) {
                              toast.error('Failed to load departments');
                            }
                          }
                        }}
                      >
                        <SelectTrigger id="role-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">College Admin</SelectItem>
                          <SelectItem value="deptAdmin">Department Admin</SelectItem>
                          <SelectItem value="superAdmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(roleAssignmentData.role === 'admin' || roleAssignmentData.role === 'deptAdmin') && (
                      <div className="space-y-2">
                        <Label htmlFor="role-college">College *</Label>
                        <Select
                          value={roleAssignmentData.college}
                          onValueChange={async (value) => {
                            setRoleAssignmentData({
                              ...roleAssignmentData,
                              college: value,
                              // Reset department when changing college
                              department: '',
                            });
                            // Fetch departments for the selected college if deptAdmin
                            if (roleAssignmentData.role === 'deptAdmin' && value) {
                              try {
                                const depts = await getCollegeDepartments(value);
                                setDepartments(depts);
                                setSelectedCollegeForDept(value);
                              } catch (error: any) {
                                toast.error('Failed to load departments');
                              }
                            }
                          }}
                        >
                          <SelectTrigger id="role-college">
                            <SelectValue placeholder="Select a college" />
                          </SelectTrigger>
                          <SelectContent>
                            {colleges.map((college) => (
                              <SelectItem key={college._id || college.name} value={college.name}>
                                {college.name} {college.location && `(${college.location})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {roleAssignmentData.role === 'deptAdmin' && (
                      <div className="space-y-2">
                        <Label htmlFor="role-department">Department *</Label>
                        <Select
                          value={roleAssignmentData.department}
                          onValueChange={(value) => setRoleAssignmentData({ ...roleAssignmentData, department: value })}
                          disabled={!roleAssignmentData.college}
                        >
                          <SelectTrigger id="role-department">
                            <SelectValue placeholder={roleAssignmentData.college ? "Select a department" : "Select a college first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {roleAssignmentData.college && selectedCollegeForDept === roleAssignmentData.college && departments.length > 0 ? (
                              departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))
                            ) : roleAssignmentData.college ? (
                              <SelectItem value="" disabled>Loading departments...</SelectItem>
                            ) : (
                              <SelectItem value="" disabled>Select a college first</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {roleAssignmentData.role === 'admin' && (
                      <p className="text-xs text-muted-foreground">
                        Admins must be assigned to one college only
                      </p>
                    )}

                    {roleAssignmentData.role === 'deptAdmin' && (
                      <p className="text-xs text-muted-foreground">
                        Department admins manage a specific department within a college
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRoleAssignmentDialogOpen(false);
                        setRoleAssignmentUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveRoleAssignment}
                      disabled={isSubmitting}
                      className="bg-gradient-streak border-0 text-white"
                    >
                      {isSubmitting ? 'Saving...' : 'Assign Role'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Department Management Tab */}
            <TabsContent value="departments">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Department Management</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage departments for any college
                  </p>
                </div>
                <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-streak border-0 text-white"
                      disabled={!selectedCollegeForDept}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>
                        Add a new department to {selectedCollegeForDept || 'the selected college'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="department-name">Department Name *</Label>
                        <Input
                          id="department-name"
                          placeholder="e.g., Computer Science, Information Technology"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddDepartment();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddDeptDialogOpen(false);
                          setNewDepartment('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddDepartment}
                        disabled={isSubmitting || !newDepartment.trim()}
                        className="bg-gradient-streak border-0 text-white"
                      >
                        {isSubmitting ? 'Adding...' : 'Add Department'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* College Selector */}
              <div className="mb-6 space-y-2">
                <Label htmlFor="college-select">Select College</Label>
                <Select
                  value={selectedCollegeForDept}
                  onValueChange={setSelectedCollegeForDept}
                >
                  <SelectTrigger id="college-select">
                    <SelectValue placeholder="Select a college to manage departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college._id || college.name} value={college.name}>
                        {college.name} {college.location && `(${college.location})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedCollegeForDept ? (
                <Card className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">Please select a college to manage departments.</p>
                </Card>
              ) : departmentsLoading ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department Name</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                            No departments found. Add your first department to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        departments.map((dept, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                {dept}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingDepartment({ oldName: dept, newName: dept });
                                    setIsEditDeptDialogOpen(true);
                                  }}
                                  title="Edit department"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-destructive hover:text-destructive"
                                      title="Delete department"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{dept}" from {selectedCollegeForDept}? This action cannot be undone.
                                        <span className="block mt-2 text-destructive font-medium">
                                          Note: Students assigned to this department will not be automatically updated.
                                        </span>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteDepartment(dept)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Edit Department Dialog */}
              <Dialog open={isEditDeptDialogOpen} onOpenChange={setIsEditDeptDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Department</DialogTitle>
                    <DialogDescription>
                      Update the department name for {selectedCollegeForDept}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-department-name">Department Name *</Label>
                      <Input
                        id="edit-department-name"
                        placeholder="Department name"
                        value={editingDepartment?.newName || ''}
                        onChange={(e) => setEditingDepartment(editingDepartment ? { ...editingDepartment, newName: e.target.value } : null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditDepartment();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDeptDialogOpen(false);
                        setEditingDepartment(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditDepartment}
                      disabled={isSubmitting || !editingDepartment?.newName.trim()}
                      className="bg-gradient-streak border-0 text-white"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
