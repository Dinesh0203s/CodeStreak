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
import { getColleges, createCollege, deleteCollege, banCollege, College } from '@/lib/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
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

  useEffect(() => {
    fetchColleges();
  }, []);

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
              <TabsTrigger value="colleges">College Management</TabsTrigger>
            </TabsList>

            {/* Student Overview Tab */}
            <TabsContent value="students">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Student Overview</h2>
              </div>

              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Student overview feature coming soon.</p>
                <p className="text-sm mt-2">This will display students from your college with their stats and activity.</p>
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
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
