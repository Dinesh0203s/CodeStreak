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

      const data = await getAllUsers(params);
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
      await adminUpdateUser(editingStudent.firebaseUid, editStudentData);
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

