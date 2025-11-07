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
  Users, 
  TrendingUp, 
  Award, 
  Calendar,
  Search,
  Download,
  Filter,
  Flame,
  Building2,
  Plus,
  Trash2,
  Ban,
  CheckCircle,
  GraduationCap,
  Edit,
  FileText,
  BarChart3,
  PieChart,
  FileSpreadsheet
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
  getAllUsers,
  adminUpdateUser,
  getCollegeDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  updateUserRole,
  getUserByFirebaseUid,
  College,
  User
} from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({
    name: '',
    location: '',
    departments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Student management state
  const [students, setStudents] = useState<User[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState({
    fullName: '',
    department: '',
    passoutYear: '',
    leetcodeHandle: '',
    codechefHandle: '',
  });

  // Department management state
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<{ oldName: string; newName: string } | null>(null);
  const [adminCollege, setAdminCollege] = useState<string>('');

  // Department Admin management state
  const [deptAdmins, setDeptAdmins] = useState<User[]>([]);
  const [deptAdminsLoading, setDeptAdminsLoading] = useState(false);
  const [isDeptAdminDialogOpen, setIsDeptAdminDialogOpen] = useState(false);
  const [deptAdminUser, setDeptAdminUser] = useState<User | null>(null);
  const [selectedDeptForAdmin, setSelectedDeptForAdmin] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  // Check if user is admin before loading dashboard
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!currentUser?.uid) {
        navigate('/auth');
        return;
      }

      try {
        const userData = await getUserByFirebaseUid(currentUser.uid);
        const role = userData.role || 'user';
        
        // Redirect if not admin
        if (role !== 'admin') {
          if (role === 'superAdmin') {
            navigate('/super-admin');
          } else if (role === 'deptAdmin') {
            navigate('/dept-admin');
          } else {
            navigate('/dashboard');
          }
          return;
        }

        // User is admin, proceed to load data
        setCheckingRole(false);
        fetchColleges();
        fetchStudents();
        fetchDeptAdmins();
      } catch (error: any) {
        console.error('Error checking admin role:', error);
        toast.error('Failed to verify admin access');
        navigate('/dashboard');
      }
    };

    checkAdminRole();
  }, [currentUser?.uid, navigate]);

  useEffect(() => {
    if (checkingRole) return; // Don't fetch if still checking role
    
    fetchColleges();
    fetchStudents();
    fetchDeptAdmins();
  }, [studentPage, currentUser?.email, checkingRole]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (studentPage === 1) {
        fetchStudents();
      } else {
        setStudentPage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [studentSearchQuery]);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      // Get current user's college
      const { getUserByFirebaseUid } = await import('@/lib/api');
      const currentUserData = currentUser?.uid ? await getUserByFirebaseUid(currentUser.uid).catch(() => null) : null;
      const userCollege = currentUserData?.college;

      if (!userCollege) {
        toast.error('Your college assignment is not set. Please contact a super admin.');
        setColleges([]);
        setAdminCollege('');
        return;
      }

      setAdminCollege(userCollege);

      // Only fetch the admin's assigned college
      const allColleges = await getColleges();
      const adminCollegeData = allColleges.find(c => c.name === userCollege);
      setColleges(adminCollegeData ? [adminCollegeData] : []);
      
      // Fetch departments when college is loaded
      if (adminCollegeData) {
        fetchDepartments(userCollege);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddCollege = async () => {
    toast.error('Admins cannot add colleges. Please contact a super admin.');
  };

  const handleDeleteCollege = async (collegeId: string, collegeName: string) => {
    toast.error('Admins cannot delete colleges. Please contact a super admin.');
  };

  const handleBanCollege = async (collegeId: string, isBanned: boolean, collegeName: string) => {
    toast.error('Admins cannot ban/unban colleges. Please contact a super admin.');
  };

  // Department management functions
  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      toast.error('Department name is required');
      return;
    }

    if (!adminCollege) {
      toast.error('College assignment not found');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDepartment(adminCollege, newDepartment.trim());
      toast.success('Department added successfully');
      setNewDepartment('');
      setIsAddDeptDialogOpen(false);
      await fetchDepartments(adminCollege);
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

    if (!adminCollege) {
      toast.error('College assignment not found');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDepartment(adminCollege, editingDepartment.oldName, editingDepartment.newName.trim());
      toast.success('Department updated successfully');
      setEditingDepartment(null);
      setIsEditDeptDialogOpen(false);
      await fetchDepartments(adminCollege);
      await fetchColleges(); // Refresh college data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!adminCollege) {
      toast.error('College assignment not found');
      return;
    }

    try {
      await deleteDepartment(adminCollege, departmentName);
      toast.success('Department deleted successfully');
      await fetchDepartments(adminCollege);
      await fetchColleges(); // Refresh college data
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    }
  };

  // Department Admin management functions
  const fetchDeptAdmins = async () => {
    if (!adminCollege) return;
    
    try {
      setDeptAdminsLoading(true);
      const params: any = {
        page: 1,
        limit: 100,
        college: adminCollege,
        role: 'deptAdmin',
      };
      const data = await getAllUsers(currentUser.uid, params);
      setDeptAdmins(data.users);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load department admins');
    } finally {
      setDeptAdminsLoading(false);
    }
  };

  const handleAssignDeptAdmin = async () => {
    if (!deptAdminUser || !selectedDeptForAdmin || !adminCollege) {
      toast.error('Please select a user and department');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserRole(currentUser.uid, deptAdminUser.firebaseUid, 'deptAdmin', adminCollege, selectedDeptForAdmin);
      toast.success('Department admin assigned successfully');
      setIsDeptAdminDialogOpen(false);
      setDeptAdminUser(null);
      setSelectedDeptForAdmin('');
      await fetchDeptAdmins();
      await fetchStudents(); // Refresh student list
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign department admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDeptAdmin = async (firebaseUid: string, userName: string) => {
    try {
      await updateUserRole(currentUser.uid, firebaseUid, 'user');
      toast.success(`Department admin role removed from ${userName}`);
      await fetchDeptAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove department admin');
    }
  };

  const fetchAvailableUsers = async () => {
    if (!adminCollege) return;
    
    try {
      setLoadingAvailableUsers(true);
      const params: any = {
        page: 1,
        limit: 200,
        college: adminCollege,
      };
      const data = await getAllUsers(currentUser.uid, params);
      // Filter to only regular users (not admins, superAdmins, or deptAdmins)
      const users = data.users.filter(u => u.role === 'user' || !u.role);
      setAvailableUsers(users);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoadingAvailableUsers(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      // Get current user's college from their profile
      const { getUserByFirebaseUid } = await import('@/lib/api');
      const currentUserData = currentUser?.uid ? await getUserByFirebaseUid(currentUser.uid).catch(() => null) : null;
      const userCollege = currentUserData?.college;

      if (!userCollege) {
        toast.error('Your college information is not set. Please update your profile.');
        return;
      }

      const params: any = {
        page: studentPage,
        limit: 20,
        college: userCollege,
      };
      if (studentSearchQuery) params.search = studentSearchQuery;

      const data = await getAllUsers(currentUser.uid, params);
      setStudents(data.users);
      setStudentTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleEditStudent = (student: User) => {
    setEditingStudent(student);
    setEditStudentData({
      fullName: student.fullName || '',
      department: student.department || '',
      passoutYear: student.passoutYear || '',
      leetcodeHandle: student.leetcodeHandle || '',
      codechefHandle: student.codechefHandle || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;

    try {
      setIsSubmitting(true);
      await adminUpdateUser(currentUser.uid, editingStudent.firebaseUid, editStudentData);
      toast.success('Student updated successfully');
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Report generation functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas or quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Report "${filename}" downloaded successfully`);
  };

  const generateReport = async (reportType: string) => {
    try {
      if (students.length === 0) {
        toast.error('No student data available. Please load students first.');
        return;
      }

      switch (reportType) {
        case 'student-performance':
          exportStudentPerformanceReport();
          break;
        case 'department-stats':
          exportDepartmentStats();
          break;
        case 'activity-report':
          exportActivityReport();
          break;
        case 'full-export':
          exportFullData();
          break;
        case 'leaderboard':
          exportLeaderboard();
          break;
        case 'summary':
          exportSummaryReport();
          break;
        default:
          toast.error('Unknown report type');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    }
  };

  const exportStudentPerformanceReport = () => {
    const reportData = students.map((student, index) => ({
      Rank: index + 1,
      Name: student.fullName || student.displayName,
      Email: student.email,
      Department: student.department || 'N/A',
      'Passout Year': student.passoutYear || 'N/A',
      'Current Streak': student.currentStreak || 0,
      'Longest Streak': student.longestStreak || 0,
      'Total Problems Solved': student.totalProblemsSolved || 0,
      'Last Solved Date': student.lastSolvedDate ? new Date(student.lastSolvedDate).toLocaleDateString() : 'Never',
      'LeetCode Handle': student.leetcodeHandle || 'N/A',
      'CodeChef Handle': student.codechefHandle || 'N/A',
    }));

    const collegeName = students[0]?.college || 'College';
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(reportData, `Student_Performance_Report_${collegeName.replace(/\s+/g, '_')}_${timestamp}.csv`);
  };

  const exportDepartmentStats = () => {
    const deptStats: Record<string, { students: number; totalSolved: number; totalStreak: number }> = {};
    
    students.forEach(student => {
      const dept = student.department || 'Unknown';
      if (!deptStats[dept]) {
        deptStats[dept] = { students: 0, totalSolved: 0, totalStreak: 0 };
      }
      deptStats[dept].students++;
      deptStats[dept].totalSolved += student.totalProblemsSolved || 0;
      deptStats[dept].totalStreak += student.currentStreak || 0;
    });

    const reportData = Object.entries(deptStats).map(([dept, stats]) => ({
      Department: dept,
      'Total Students': stats.students,
      'Total Problems Solved': stats.totalSolved,
      'Average Problems per Student': Math.round(stats.totalSolved / stats.students),
      'Total Streak Days': stats.totalStreak,
      'Average Streak': Math.round(stats.totalStreak / stats.students),
    }));

    const collegeName = students[0]?.college || 'College';
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(reportData, `Department_Statistics_${collegeName.replace(/\s+/g, '_')}_${timestamp}.csv`);
  };

  const exportActivityReport = () => {
    const activeStudents = students.filter(s => (s.currentStreak || 0) > 0);
    const inactiveStudents = students.filter(s => (s.currentStreak || 0) === 0);
    
    const reportData = [
      {
        Category: 'Total Students',
        Count: students.length,
        Percentage: '100%'
      },
      {
        Category: 'Active Students (with streak)',
        Count: activeStudents.length,
        Percentage: `${Math.round((activeStudents.length / students.length) * 100)}%`
      },
      {
        Category: 'Inactive Students',
        Count: inactiveStudents.length,
        Percentage: `${Math.round((inactiveStudents.length / students.length) * 100)}%`
      },
      {
        Category: 'Students with 7+ day streak',
        Count: students.filter(s => (s.currentStreak || 0) >= 7).length,
        Percentage: `${Math.round((students.filter(s => (s.currentStreak || 0) >= 7).length / students.length) * 100)}%`
      },
      {
        Category: 'Students with 30+ day streak',
        Count: students.filter(s => (s.currentStreak || 0) >= 30).length,
        Percentage: `${Math.round((students.filter(s => (s.currentStreak || 0) >= 30).length / students.length) * 100)}%`
      },
    ];

    const collegeName = students[0]?.college || 'College';
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(reportData, `Activity_Report_${collegeName.replace(/\s+/g, '_')}_${timestamp}.csv`);
  };

  const exportFullData = () => {
    const reportData = students.map((student) => ({
      Name: student.fullName || student.displayName,
      Email: student.email,
      College: student.college || 'N/A',
      Department: student.department || 'N/A',
      'Passout Year': student.passoutYear || 'N/A',
      'Current Streak': student.currentStreak || 0,
      'Longest Streak': student.longestStreak || 0,
      'Total Problems Solved': student.totalProblemsSolved || 0,
      'Last Solved Date': student.lastSolvedDate ? new Date(student.lastSolvedDate).toLocaleDateString() : 'Never',
      'LeetCode Handle': student.leetcodeHandle || 'N/A',
      'CodeChef Handle': student.codechefHandle || 'N/A',
      'LeetCode Solved': student.leetcodeStats?.solvedProblems || 0,
      'CodeChef Solved': student.codechefStats?.problemsSolved || 0,
      'Account Created': student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A',
      'Last Updated': student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : 'N/A',
    }));

    const collegeName = students[0]?.college || 'College';
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(reportData, `Full_Data_Export_${collegeName.replace(/\s+/g, '_')}_${timestamp}.csv`);
  };

  const exportLeaderboard = () => {
    // Sort by streak first, then by problems solved
    const sorted = [...students].sort((a, b) => {
      const streakDiff = (b.currentStreak || 0) - (a.currentStreak || 0);
      if (streakDiff !== 0) return streakDiff;
      return (b.totalProblemsSolved || 0) - (a.totalProblemsSolved || 0);
    });

    const reportData = sorted.map((student, index) => ({
      Rank: index + 1,
      Name: student.fullName || student.displayName,
      Email: student.email,
      Department: student.department || 'N/A',
      'Current Streak': student.currentStreak || 0,
      'Longest Streak': student.longestStreak || 0,
      'Total Problems Solved': student.totalProblemsSolved || 0,
      'LeetCode Problems': student.leetcodeStats?.solvedProblems || 0,
      'CodeChef Problems': student.codechefStats?.problemsSolved || 0,
    }));

    const collegeName = students[0]?.college || 'College';
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(reportData, `Leaderboard_${collegeName.replace(/\s+/g, '_')}_${timestamp}.csv`);
  };

  const exportSummaryReport = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => (s.currentStreak || 0) > 0).length;
    const totalSolved = students.reduce((sum, s) => sum + (s.totalProblemsSolved || 0), 0);
    const totalStreak = students.reduce((sum, s) => sum + (s.currentStreak || 0), 0);
    const avgStreak = totalStudents > 0 ? Math.round(totalStreak / totalStudents) : 0;
    const avgSolved = totalStudents > 0 ? Math.round(totalSolved / totalStudents) : 0;

    const reportData = [
      { Metric: 'Total Students', Value: totalStudents },
      { Metric: 'Active Students (with streak)', Value: activeStudents },
      { Metric: 'Inactive Students', Value: totalStudents - activeStudents },
      { Metric: 'Total Problems Solved', Value: totalSolved },
      { Metric: 'Average Problems per Student', Value: avgSolved },
      { Metric: 'Total Streak Days', Value: totalStreak },
      { Metric: 'Average Streak (days)', Value: avgStreak },
      { Metric: 'Students with 7+ day streak', Value: students.filter(s => (s.currentStreak || 0) >= 7).length },
      { Metric: 'Students with 30+ day streak', Value: students.filter(s => (s.currentStreak || 0) >= 30).length },
      { Metric: 'Students with 100+ problems solved', Value: students.filter(s => (s.totalProblemsSolved || 0) >= 100).length },
      { Metric: 'Report Generated', Value: new Date().toLocaleString() },
    ];

    const collegeName = students[0]?.college || 'College';
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(reportData, `Summary_Report_${collegeName.replace(/\s+/g, '_')}_${timestamp}.csv`);
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state while checking role
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-streak mx-auto mb-4"></div>
          <div>Verifying admin access...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage colleges and view analytics
          </p>
        </div>

        {/* Tabs for Student Overview, Department Management, and College Management */}
        <Card className="p-6">
          <Tabs defaultValue="students">
            <TabsList className="mb-6">
              <TabsTrigger value="students">Student Overview</TabsTrigger>
              <TabsTrigger value="departments">Department Management</TabsTrigger>
              <TabsTrigger value="deptAdmins">Department Admins</TabsTrigger>
              <TabsTrigger value="colleges">College Information</TabsTrigger>
              <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            </TabsList>

            {/* Student Overview Tab */}
            <TabsContent value="students">
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Student Overview</h2>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {studentsLoading ? (
                <div className="text-center py-8">Loading students...</div>
              ) : (
                <>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Streak</TableHead>
                          <TableHead>Solved</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No students found
                            </TableCell>
                          </TableRow>
                        ) : (
                          students.map((student) => (
                            <TableRow key={student._id || student.firebaseUid}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {student.photoURL && (
                                    <img 
                                      src={student.photoURL} 
                                      alt={student.displayName}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <div>{student.fullName || student.displayName}</div>
                                    {student.passoutYear && (
                                      <div className="text-xs text-muted-foreground">
                                        Batch: {student.passoutYear}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{student.email}</TableCell>
                              <TableCell>{student.department || '-'}</TableCell>
                              <TableCell>
                                {student.currentStreak !== undefined ? (
                                  <div className="flex items-center gap-1 text-streak font-semibold">
                                    <Flame className="h-4 w-4" />
                                    {student.currentStreak} days
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {student.totalProblemsSolved !== undefined ? (
                                  <span className="font-medium">{student.totalProblemsSolved}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStudent(student)}
                                  title="Edit student"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {studentTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {studentPage} of {studentTotalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                          disabled={studentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                          disabled={studentPage === studentTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Edit Student Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                      Update student information. Changes will be saved immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-fullName">Full Name</Label>
                      <Input
                        id="student-fullName"
                        value={editStudentData.fullName}
                        onChange={(e) => setEditStudentData({ ...editStudentData, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-department">Department</Label>
                      <Input
                        id="student-department"
                        value={editStudentData.department}
                        onChange={(e) => setEditStudentData({ ...editStudentData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-passoutYear">Passout Year</Label>
                      <Input
                        id="student-passoutYear"
                        value={editStudentData.passoutYear}
                        onChange={(e) => setEditStudentData({ ...editStudentData, passoutYear: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-leetcodeHandle">LeetCode Handle</Label>
                      <Input
                        id="student-leetcodeHandle"
                        value={editStudentData.leetcodeHandle}
                        onChange={(e) => setEditStudentData({ ...editStudentData, leetcodeHandle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-codechefHandle">CodeChef Handle</Label>
                      <Input
                        id="student-codechefHandle"
                        value={editStudentData.codechefHandle}
                        onChange={(e) => setEditStudentData({ ...editStudentData, codechefHandle: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingStudent(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveStudent}
                      disabled={isSubmitting}
                      className="bg-gradient-streak border-0 text-white"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
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
                    Manage departments for {adminCollege || 'your college'}
                  </p>
                </div>
                <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-streak border-0 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>
                        Add a new department to your college
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

              {!adminCollege ? (
                <Card className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">Your college assignment is not set.</p>
                  <p className="text-sm text-muted-foreground mt-2">Please contact a super admin to assign you to a college.</p>
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
                                        Are you sure you want to delete "{dept}"? This action cannot be undone.
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
                      Update the department name
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

            {/* Department Admins Management Tab */}
            <TabsContent value="deptAdmins">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Department Admins</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assign department admins to manage specific departments
                  </p>
                </div>
                <Dialog open={isDeptAdminDialogOpen} onOpenChange={(open) => {
                  setIsDeptAdminDialogOpen(open);
                  if (open) {
                    fetchAvailableUsers();
                  } else {
                    setDeptAdminUser(null);
                    setSelectedDeptForAdmin('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-streak border-0 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Assign Department Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Assign Department Admin</DialogTitle>
                      <DialogDescription>
                        Select a user and assign them as admin for a specific department
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select User</Label>
                        <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                          {loadingAvailableUsers ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p>
                          ) : availableUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No users available. Users must be from your college.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {availableUsers.map((user) => (
                                <div
                                  key={user.firebaseUid}
                                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                    deptAdminUser?.firebaseUid === user.firebaseUid
                                      ? 'border-primary bg-primary/10'
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => setDeptAdminUser(user)}
                                >
                                  <div className="flex items-center gap-3">
                                    {user.photoURL && (
                                      <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-10 h-10 rounded-full"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium">{user.fullName || user.displayName}</div>
                                      <div className="text-sm text-muted-foreground">{user.email}</div>
                                      {user.department && (
                                        <div className="text-xs text-muted-foreground">Current: {user.department}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dept-admin-dept">Department *</Label>
                        <Select
                          value={selectedDeptForAdmin}
                          onValueChange={setSelectedDeptForAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          This admin will only manage students from the selected department
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDeptAdminDialogOpen(false);
                          setDeptAdminUser(null);
                          setSelectedDeptForAdmin('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssignDeptAdmin}
                        disabled={isSubmitting || !deptAdminUser || !selectedDeptForAdmin}
                        className="bg-gradient-streak border-0 text-white"
                      >
                        {isSubmitting ? 'Assigning...' : 'Assign Department Admin'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {deptAdminsLoading ? (
                <div className="text-center py-8">Loading department admins...</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deptAdmins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No department admins assigned yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        deptAdmins.map((admin) => (
                          <TableRow key={admin.firebaseUid}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {admin.photoURL && (
                                  <img
                                    src={admin.photoURL}
                                    alt={admin.displayName}
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                <div>
                                  <div>{admin.fullName || admin.displayName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                      Dept Admin
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                {admin.department || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Department Admin</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove department admin role from "{admin.fullName || admin.displayName}"?
                                      They will become a regular user.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveDeptAdmin(admin.firebaseUid, admin.fullName || admin.displayName)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* College Management Tab */}
            <TabsContent value="colleges">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">College Information</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View-only: You can only manage your assigned college's students
                </p>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading college information...</div>
              ) : colleges.length === 0 ? (
                <Card className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">Your college assignment is not set.</p>
                  <p className="text-sm text-muted-foreground mt-2">Please contact a super admin to assign you to a college.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {colleges.map((college) => (
                    <Card key={college._id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="text-xl font-semibold">{college.name}</h3>
                            {college.location && (
                              <p className="text-sm text-muted-foreground">{college.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{college.studentCount || 0}</div>
                          <div className="text-sm text-muted-foreground">Students</div>
                        </div>
                      </div>

                      {college.departments && college.departments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Departments:</h4>
                          <div className="flex flex-wrap gap-2">
                            {college.departments.map((dept, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-muted"
                              >
                                {dept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
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
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reports & Analytics Tab */}
            <TabsContent value="reports">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Reports & Analytics</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate comprehensive reports and analytics for your college
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Report Type Cards */}
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('student-performance')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Student Performance</h3>
                      <p className="text-xs text-muted-foreground">Streaks, solved problems</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('department-stats')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <PieChart className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Department Stats</h3>
                      <p className="text-xs text-muted-foreground">Performance by department</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('activity-report')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-streak/10">
                      <FileText className="h-6 w-6 text-streak" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Activity Report</h3>
                      <p className="text-xs text-muted-foreground">Daily/weekly activity</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('full-export')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-challenge/10">
                      <FileSpreadsheet className="h-6 w-6 text-challenge" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Full Data Export</h3>
                      <p className="text-xs text-muted-foreground">Complete student data (CSV)</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('leaderboard')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-premium/10">
                      <Award className="h-6 w-6 text-premium" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Leaderboard Export</h3>
                      <p className="text-xs text-muted-foreground">Top performers (CSV)</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('summary')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <FileText className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Summary Report</h3>
                      <p className="text-xs text-muted-foreground">Overview & statistics</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>
              </div>

              {/* Analytics Dashboard */}
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">College Analytics</h3>
                {students.length > 0 ? (
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{students.length}</div>
                      <div className="text-sm text-muted-foreground">Total Students</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">
                        {students.filter(s => (s.currentStreak || 0) > 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Streaks</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">
                        {students.reduce((sum, s) => sum + (s.totalProblemsSolved || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Problems Solved</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">
                        {students.length > 0 
                          ? Math.round(students.reduce((sum, s) => sum + (s.currentStreak || 0), 0) / students.length)
                          : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Streak (days)</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Load students to see analytics
                  </div>
                )}
              </Card>

              {/* Department Breakdown */}
              {students.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Department Breakdown</h3>
                  <div className="space-y-4">
                    {(() => {
                      const deptStats: Record<string, { count: number; totalSolved: number; avgStreak: number }> = {};
                      students.forEach(student => {
                        const dept = student.department || 'Unknown';
                        if (!deptStats[dept]) {
                          deptStats[dept] = { count: 0, totalSolved: 0, avgStreak: 0 };
                        }
                        deptStats[dept].count++;
                        deptStats[dept].totalSolved += student.totalProblemsSolved || 0;
                        deptStats[dept].avgStreak += student.currentStreak || 0;
                      });
                      Object.keys(deptStats).forEach(dept => {
                        deptStats[dept].avgStreak = Math.round(deptStats[dept].avgStreak / deptStats[dept].count);
                      });
                      return Object.entries(deptStats).map(([dept, stats]) => (
                        <div key={dept} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{dept}</h4>
                            <span className="text-sm text-muted-foreground">{stats.count} students</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Total Solved</div>
                              <div className="font-semibold">{stats.totalSolved}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Avg Streak</div>
                              <div className="font-semibold">{stats.avgStreak} days</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Avg per Student</div>
                              <div className="font-semibold">{Math.round(stats.totalSolved / stats.count)}</div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
