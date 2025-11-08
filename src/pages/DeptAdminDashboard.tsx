import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search,
  Download,
  Flame,
  GraduationCap,
  Edit,
  FileText,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  getAllUsers,
  adminUpdateUser,
  User
} from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const DeptAdminDashboard = () => {
  const { user: currentUser } = useAuth();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deptAdminInfo, setDeptAdminInfo] = useState<{ college: string; department: string } | null>(null);

  useEffect(() => {
    fetchDeptAdminInfo();
    fetchStudents();
  }, [studentPage, currentUser?.email]);

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

  const fetchDeptAdminInfo = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const { getUserByFirebaseUid } = await import('@/lib/api');
      const userData = await getUserByFirebaseUid(currentUser.uid);
      if (userData.college && userData.department) {
        setDeptAdminInfo({ college: userData.college, department: userData.department });
      }
    } catch (error: any) {
      console.error('Error fetching department admin info:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      // Get current user's college and department from their profile
      const { getUserByFirebaseUid } = await import('@/lib/api');
      const currentUserData = currentUser?.uid ? await getUserByFirebaseUid(currentUser.uid).catch(() => null) : null;
      const userCollege = currentUserData?.college;
      const userDepartment = currentUserData?.department;

      if (!userCollege || !userDepartment) {
        toast.error('Your college and department information is not set. Please contact an admin.');
        return;
      }

      const params: any = {
        page: studentPage,
        limit: 20,
        college: userCollege,
        department: userDepartment, // Filter by department
      };
      if (studentSearchQuery) params.search = studentSearchQuery;

      const data = await getAllUsers(currentUser.uid, params);
      // Filter out admins and deptAdmins, only show regular users
      const filteredStudents = data.users.filter(s => s.role === 'user' || !s.role);
      setStudents(filteredStudents);
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

  // Report generation functions (same as AdminDashboard but filtered to department)
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

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

      const deptName = deptAdminInfo?.department || 'Department';
      const collegeName = deptAdminInfo?.college || 'College';

      switch (reportType) {
        case 'student-performance':
          const perfData = students.map((student, index) => ({
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
          const timestamp = new Date().toISOString().split('T')[0];
          exportToCSV(perfData, `Student_Performance_${deptName.replace(/\s+/g, '_')}_${timestamp}.csv`);
          break;
        case 'summary':
          const totalStudents = students.length;
          const activeStudents = students.filter(s => (s.currentStreak || 0) > 0).length;
          const totalSolved = students.reduce((sum, s) => sum + (s.totalProblemsSolved || 0), 0);
          const totalStreak = students.reduce((sum, s) => sum + (s.currentStreak || 0), 0);
          const avgStreak = totalStudents > 0 ? Math.round(totalStreak / totalStudents) : 0;
          const avgSolved = totalStudents > 0 ? Math.round(totalSolved / totalStudents) : 0;

          const summaryData = [
            { Metric: 'Total Students', Value: totalStudents },
            { Metric: 'Active Students (with streak)', Value: activeStudents },
            { Metric: 'Inactive Students', Value: totalStudents - activeStudents },
            { Metric: 'Total Problems Solved', Value: totalSolved },
            { Metric: 'Average Problems per Student', Value: avgSolved },
            { Metric: 'Total Streak Days', Value: totalStreak },
            { Metric: 'Average Streak (days)', Value: avgStreak },
            { Metric: 'Students with 7+ day streak', Value: students.filter(s => (s.currentStreak || 0) >= 7).length },
            { Metric: 'Students with 30+ day streak', Value: students.filter(s => (s.currentStreak || 0) >= 30).length },
            { Metric: 'Report Generated', Value: new Date().toLocaleString() },
          ];
          const timestamp2 = new Date().toISOString().split('T')[0];
          exportToCSV(summaryData, `Summary_Report_${deptName.replace(/\s+/g, '_')}_${timestamp2}.csv`);
          break;
        case 'full-export':
          const fullData = students.map((student) => ({
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
          }));
          const timestamp3 = new Date().toISOString().split('T')[0];
          exportToCSV(fullData, `Full_Data_Export_${deptName.replace(/\s+/g, '_')}_${timestamp3}.csv`);
          break;
        case 'daywise-leetcode':
          // Collect all day-wise data from all students
          const daywiseData: Array<{
            Date: string;
            Student: string;
            Email: string;
            Department: string;
            'LeetCode Handle': string;
            'Easy Problems': number;
            'Medium Problems': number;
            'Hard Problems': number;
            'Total Problems': number;
          }> = [];

          students.forEach((student) => {
            const breakdown = student.leetcodeStats?.dailyDifficultyBreakdown || [];
            
            if (breakdown.length === 0) {
              // If no day-wise data, still add a row showing no data
              daywiseData.push({
                Date: 'N/A',
                Student: student.fullName || student.displayName,
                Email: student.email,
                Department: student.department || 'N/A',
                'LeetCode Handle': student.leetcodeHandle || 'N/A',
                'Easy Problems': 0,
                'Medium Problems': 0,
                'Hard Problems': 0,
                'Total Problems': 0,
              });
            } else {
              // Add a row for each day
              breakdown.forEach((day) => {
                daywiseData.push({
                  Date: day.date,
                  Student: student.fullName || student.displayName,
                  Email: student.email,
                  Department: student.department || 'N/A',
                  'LeetCode Handle': student.leetcodeHandle || 'N/A',
                  'Easy Problems': day.easy || 0,
                  'Medium Problems': day.medium || 0,
                  'Hard Problems': day.hard || 0,
                  'Total Problems': day.total || 0,
                });
              });
            }
          });

          // Sort by date, then by student name
          daywiseData.sort((a, b) => {
            if (a.Date === 'N/A' && b.Date !== 'N/A') return 1;
            if (a.Date !== 'N/A' && b.Date === 'N/A') return -1;
            if (a.Date !== 'N/A' && b.Date !== 'N/A') {
              const dateCompare = a.Date.localeCompare(b.Date);
              if (dateCompare !== 0) return dateCompare;
            }
            return a.Student.localeCompare(b.Student);
          });

          const timestamp4 = new Date().toISOString().split('T')[0];
          exportToCSV(daywiseData, `Daywise_LeetCode_Report_${deptName.replace(/\s+/g, '_')}_${timestamp4}.csv`);
          break;
        case 'daywise-codechef':
          // Collect all day-wise data from all students
          const codechefDaywiseData: Array<{
            Date: string;
            Student: string;
            Email: string;
            Department: string;
            'CodeChef Handle': string;
            'Problems Solved': number;
          }> = [];

          students.forEach((student) => {
            const submissionDates = student.codechefStats?.submissionDates || [];
            
            if (submissionDates.length === 0) {
              codechefDaywiseData.push({
                Date: 'N/A',
                Student: student.fullName || student.displayName,
                Email: student.email,
                Department: student.department || 'N/A',
                'CodeChef Handle': student.codechefHandle || 'N/A',
                'Problems Solved': 0,
              });
            } else {
              submissionDates.forEach((day) => {
                codechefDaywiseData.push({
                  Date: day.date,
                  Student: student.fullName || student.displayName,
                  Email: student.email,
                  Department: student.department || 'N/A',
                  'CodeChef Handle': student.codechefHandle || 'N/A',
                  'Problems Solved': day.count || 0,
                });
              });
            }
          });

          codechefDaywiseData.sort((a, b) => {
            if (a.Date === 'N/A' && b.Date !== 'N/A') return 1;
            if (a.Date !== 'N/A' && b.Date === 'N/A') return -1;
            if (a.Date !== 'N/A' && b.Date !== 'N/A') {
              const dateCompare = a.Date.localeCompare(b.Date);
              if (dateCompare !== 0) return dateCompare;
            }
            return a.Student.localeCompare(b.Student);
          });

          const timestamp5 = new Date().toISOString().split('T')[0];
          exportToCSV(codechefDaywiseData, `Daywise_CodeChef_Report_${deptName.replace(/\s+/g, '_')}_${timestamp5}.csv`);
          break;
        case 'daywise-overall':
          // Collect all day-wise data from all students (combining LeetCode and CodeChef)
          const overallDaywiseData: Array<{
            Date: string;
            Student: string;
            Email: string;
            Department: string;
            'LeetCode Easy': number;
            'LeetCode Medium': number;
            'LeetCode Hard': number;
            'LeetCode Total': number;
            'CodeChef Problems': number;
            'Total Problems': number;
          }> = [];

          // Create a map to combine data by date and student
          const dateMap: { [key: string]: { [studentEmail: string]: any } } = {};

          students.forEach((student) => {
            const studentEmail = student.email;
            const studentName = student.fullName || student.displayName;
            const department = student.department || 'N/A';

            // Process LeetCode data
            const leetcodeBreakdown = student.leetcodeStats?.dailyDifficultyBreakdown || [];
            leetcodeBreakdown.forEach((day) => {
              if (!dateMap[day.date]) {
                dateMap[day.date] = {};
              }
              if (!dateMap[day.date][studentEmail]) {
                dateMap[day.date][studentEmail] = {
                  Date: day.date,
                  Student: studentName,
                  Email: studentEmail,
                  Department: department,
                  'LeetCode Easy': 0,
                  'LeetCode Medium': 0,
                  'LeetCode Hard': 0,
                  'LeetCode Total': 0,
                  'CodeChef Problems': 0,
                  'Total Problems': 0,
                };
              }
              dateMap[day.date][studentEmail]['LeetCode Easy'] += day.easy || 0;
              dateMap[day.date][studentEmail]['LeetCode Medium'] += day.medium || 0;
              dateMap[day.date][studentEmail]['LeetCode Hard'] += day.hard || 0;
              dateMap[day.date][studentEmail]['LeetCode Total'] += day.total || 0;
            });

            // Process CodeChef data
            const codechefDates = student.codechefStats?.submissionDates || [];
            codechefDates.forEach((day) => {
              if (!dateMap[day.date]) {
                dateMap[day.date] = {};
              }
              if (!dateMap[day.date][studentEmail]) {
                dateMap[day.date][studentEmail] = {
                  Date: day.date,
                  Student: studentName,
                  Email: studentEmail,
                  Department: department,
                  'LeetCode Easy': 0,
                  'LeetCode Medium': 0,
                  'LeetCode Hard': 0,
                  'LeetCode Total': 0,
                  'CodeChef Problems': 0,
                  'Total Problems': 0,
                };
              }
              dateMap[day.date][studentEmail]['CodeChef Problems'] += day.count || 0;
            });
          });

          // Convert map to array and calculate totals
          Object.keys(dateMap).forEach((date) => {
            Object.keys(dateMap[date]).forEach((email) => {
              const entry = dateMap[date][email];
              entry['Total Problems'] = entry['LeetCode Total'] + entry['CodeChef Problems'];
              overallDaywiseData.push(entry);
            });
          });

          // If a student has no data at all, add a row
          students.forEach((student) => {
            const hasLeetcode = (student.leetcodeStats?.dailyDifficultyBreakdown || []).length > 0;
            const hasCodechef = (student.codechefStats?.submissionDates || []).length > 0;
            
            if (!hasLeetcode && !hasCodechef) {
              overallDaywiseData.push({
                Date: 'N/A',
                Student: student.fullName || student.displayName,
                Email: student.email,
                Department: student.department || 'N/A',
                'LeetCode Easy': 0,
                'LeetCode Medium': 0,
                'LeetCode Hard': 0,
                'LeetCode Total': 0,
                'CodeChef Problems': 0,
                'Total Problems': 0,
              });
            }
          });

          overallDaywiseData.sort((a, b) => {
            if (a.Date === 'N/A' && b.Date !== 'N/A') return 1;
            if (a.Date !== 'N/A' && b.Date === 'N/A') return -1;
            if (a.Date !== 'N/A' && b.Date !== 'N/A') {
              const dateCompare = a.Date.localeCompare(b.Date);
              if (dateCompare !== 0) return dateCompare;
            }
            return a.Student.localeCompare(b.Student);
          });

          const timestamp6 = new Date().toISOString().split('T')[0];
          exportToCSV(overallDaywiseData, `Daywise_Overall_Report_${deptName.replace(/\s+/g, '_')}_${timestamp6}.csv`);
          break;
        case 'daywise-user-details':
          // Create a comprehensive day-wise user details report
          const userDetailsData: Array<{
            Date: string;
            Student: string;
            Email: string;
            Department: string;
            'Passout Year': string;
            'LeetCode Handle': string;
            'CodeChef Handle': string;
            'LeetCode Easy': number;
            'LeetCode Medium': number;
            'LeetCode Hard': number;
            'LeetCode Total': number;
            'CodeChef Problems': number;
            'Total Problems Solved': number;
            'Current Streak': number;
            'Longest Streak': number;
            'Total Problems (All Time)': number;
            'Last Activity Date': string;
          }> = [];

          students.forEach((student) => {
            const studentName = student.fullName || student.displayName;
            const email = student.email;
            const department = student.department || 'N/A';
            const passoutYear = student.passoutYear || 'N/A';
            const leetcodeHandle = student.leetcodeHandle || 'N/A';
            const codechefHandle = student.codechefHandle || 'N/A';
            const currentStreak = student.currentStreak || 0;
            const longestStreak = student.longestStreak || 0;
            const totalProblems = student.totalProblemsSolved || 0;
            const lastSolvedDate = student.lastSolvedDate ? new Date(student.lastSolvedDate).toISOString().split('T')[0] : 'Never';

            // Get LeetCode breakdown
            const leetcodeBreakdown = student.leetcodeStats?.dailyDifficultyBreakdown || [];
            const leetcodeMap = new Map<string, { easy: number; medium: number; hard: number; total: number }>();
            leetcodeBreakdown.forEach((day) => {
              leetcodeMap.set(day.date, {
                easy: day.easy || 0,
                medium: day.medium || 0,
                hard: day.hard || 0,
                total: day.total || 0,
              });
            });

            // Get CodeChef dates
            const codechefDates = student.codechefStats?.submissionDates || [];
            const codechefMap = new Map<string, number>();
            codechefDates.forEach((day) => {
              codechefMap.set(day.date, day.count || 0);
            });

            // Get all dates for this student
            const studentDates = new Set<string>();
            leetcodeBreakdown.forEach((day) => studentDates.add(day.date));
            codechefDates.forEach((day) => studentDates.add(day.date));

            if (studentDates.size === 0) {
              // If no activity, add one row with N/A
              userDetailsData.push({
                Date: 'N/A',
                Student: studentName,
                Email: email,
                Department: department,
                'Passout Year': passoutYear,
                'LeetCode Handle': leetcodeHandle,
                'CodeChef Handle': codechefHandle,
                'LeetCode Easy': 0,
                'LeetCode Medium': 0,
                'LeetCode Hard': 0,
                'LeetCode Total': 0,
                'CodeChef Problems': 0,
                'Total Problems Solved': 0,
                'Current Streak': currentStreak,
                'Longest Streak': longestStreak,
                'Total Problems (All Time)': totalProblems,
                'Last Activity Date': lastSolvedDate,
              });
            } else {
              // Add a row for each date with activity
              Array.from(studentDates).sort().forEach((date) => {
                const leetcodeData = leetcodeMap.get(date) || { easy: 0, medium: 0, hard: 0, total: 0 };
                const codechefCount = codechefMap.get(date) || 0;
                const totalForDay = leetcodeData.total + codechefCount;

                userDetailsData.push({
                  Date: date,
                  Student: studentName,
                  Email: email,
                  Department: department,
                  'Passout Year': passoutYear,
                  'LeetCode Handle': leetcodeHandle,
                  'CodeChef Handle': codechefHandle,
                  'LeetCode Easy': leetcodeData.easy,
                  'LeetCode Medium': leetcodeData.medium,
                  'LeetCode Hard': leetcodeData.hard,
                  'LeetCode Total': leetcodeData.total,
                  'CodeChef Problems': codechefCount,
                  'Total Problems Solved': totalForDay,
                  'Current Streak': currentStreak,
                  'Longest Streak': longestStreak,
                  'Total Problems (All Time)': totalProblems,
                  'Last Activity Date': lastSolvedDate,
                });
              });
            }
          });

          // Sort by date, then by student name
          userDetailsData.sort((a, b) => {
            if (a.Date === 'N/A' && b.Date !== 'N/A') return 1;
            if (a.Date !== 'N/A' && b.Date === 'N/A') return -1;
            if (a.Date !== 'N/A' && b.Date !== 'N/A') {
              const dateCompare = a.Date.localeCompare(b.Date);
              if (dateCompare !== 0) return dateCompare;
            }
            return a.Student.localeCompare(b.Student);
          });

          const timestamp7 = new Date().toISOString().split('T')[0];
          exportToCSV(userDetailsData, `Daywise_User_Details_Report_${deptName.replace(/\s+/g, '_')}_${timestamp7}.csv`);
          break;
        default:
          toast.error('Unknown report type');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Department Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {deptAdminInfo ? (
              <>Manage students from <strong>{deptAdminInfo.department}</strong> department at <strong>{deptAdminInfo.college}</strong></>
            ) : (
              'Loading department information...'
            )}
          </p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="students">
            <TabsList className="mb-6">
              <TabsTrigger value="students">Student Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            </TabsList>

            {/* Student Overview Tab */}
            <TabsContent value="students">
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Student Overview</h2>
                </div>
                
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
                          <TableHead>Batch</TableHead>
                          <TableHead>Streak</TableHead>
                          <TableHead>Solved</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No students found in your department
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
                              <TableCell>{student.passoutYear || '-'}</TableCell>
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

            {/* Reports & Analytics Tab */}
            <TabsContent value="reports">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Reports & Analytics</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate reports for your department
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('daywise-leetcode')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-streak/10">
                      <BarChart3 className="h-6 w-6 text-streak" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Day-wise LeetCode Report</h3>
                      <p className="text-xs text-muted-foreground">Daily problems by difficulty (Easy/Medium/Hard)</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('daywise-codechef')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-challenge/10">
                      <BarChart3 className="h-6 w-6 text-challenge" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Day-wise CodeChef Report</h3>
                      <p className="text-xs text-muted-foreground">Daily problems solved on CodeChef</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('daywise-overall')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Day-wise Overall Report</h3>
                      <p className="text-xs text-muted-foreground">Combined LeetCode & CodeChef daily activity</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('daywise-user-details')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <FileText className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Day-wise User Details Report</h3>
                      <p className="text-xs text-muted-foreground">Comprehensive daily activity with user stats</p>
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
                <h3 className="text-lg font-semibold mb-4">Department Analytics</h3>
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
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default DeptAdminDashboard;

