import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByFirebaseUid, updateUserProfile, getColleges, scrapeLeetCode, scrapeCodeChef, User, College } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingLeetCode, setVerifyingLeetCode] = useState(false);
  const [verifyingCodeChef, setVerifyingCodeChef] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    college: '',
    department: '',
    passoutYear: '',
    leetcodeHandle: '',
    codechefHandle: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      // Wait for auth to finish loading before checking user
      if (authLoading) {
        return;
      }

      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const [userDataResult, collegesData] = await Promise.all([
          getUserByFirebaseUid(user.uid),
          getColleges().catch(() => []),
        ]);
        
        setUserData(userDataResult);
        setColleges(collegesData);
        setFormData({
          fullName: userDataResult.fullName || '',
          college: userDataResult.college || '',
          department: userDataResult.department || '',
          passoutYear: userDataResult.passoutYear || '',
          leetcodeHandle: userDataResult.leetcodeHandle || '',
          codechefHandle: userDataResult.codechefHandle || '',
        });
      } catch (error: any) {
        if (error.message !== 'User not found') {
          toast.error('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, navigate]);

  // Get departments for selected college
  const availableDepartments = useMemo(() => {
    const selectedCollege = colleges.find(c => c.name === formData.college);
    return selectedCollege?.departments || [];
  }, [formData.college, colleges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updated = await updateUserProfile(user.uid, formData);
      setUserData(updated);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  const displayName = userData?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
              <AvatarFallback className="bg-gradient-streak text-white text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
              <p className="text-muted-foreground">{userData?.email || user?.email}</p>
              {userData?.role && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {userData.role === 'superAdmin' ? 'Super Admin' : userData.role === 'admin' ? 'Admin' : 'User'}
                </span>
              )}
              {(userData?.college || userData?.department) && (
                <div className="mt-3 space-y-1">
                  {userData.college && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">College:</span> {userData.college}
                    </p>
                  )}
                  {userData.department && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Department:</span> {userData.department}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Select 
                  value={formData.college || ''} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, college: value, department: '' }); // Reset department when college changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.filter(c => !c.isBanned).length > 0 ? (
                      colleges.filter(c => !c.isBanned).map((college) => (
                        <SelectItem key={college._id} value={college.name}>
                          {college.name}
                          {college.location && ` - ${college.location}`}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No colleges available. Contact an admin to add your college.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {formData.college && (
                  <p className="text-xs text-muted-foreground">
                    Current: <span className="font-medium">{formData.college}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Only admin-created colleges are available.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={formData.department || ''} 
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                  disabled={!formData.college || availableDepartments.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.college 
                        ? "Select college first" 
                        : availableDepartments.length === 0
                          ? "No departments available for this college"
                          : "Select your department"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.length > 0 ? (
                      availableDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))
                    ) : formData.college ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No departments configured for this college.
                      </div>
                    ) : null}
                  </SelectContent>
                </Select>
                {formData.department && (
                  <p className="text-xs text-muted-foreground">
                    Current: <span className="font-medium">{formData.department}</span>
                  </p>
                )}
                {formData.college && availableDepartments.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    This college has no departments configured. Contact an admin to add departments.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passoutYear">Passout Year</Label>
                <Input
                  id="passoutYear"
                  value={formData.passoutYear}
                  onChange={(e) => setFormData({ ...formData, passoutYear: e.target.value })}
                  placeholder="Year of graduation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leetcodeHandle">LeetCode Handle</Label>
                <div className="flex gap-2">
                  <Input
                    id="leetcodeHandle"
                    value={formData.leetcodeHandle}
                    onChange={(e) => setFormData({ ...formData, leetcodeHandle: e.target.value })}
                    placeholder="your_leetcode_handle"
                    className="flex-1"
                  />
                  {formData.leetcodeHandle && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={verifyingLeetCode}
                      onClick={async () => {
                        setVerifyingLeetCode(true);
                        try {
                          const data = await scrapeLeetCode(formData.leetcodeHandle);
                          if (data.success) {
                            toast.success(`Found profile! Solved ${data.solvedProblems} problems (Easy: ${data.easySolved}, Medium: ${data.mediumSolved}, Hard: ${data.hardSolved})`);
                          } else {
                            toast.error('Profile not found or private');
                          }
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to verify LeetCode profile');
                        } finally {
                          setVerifyingLeetCode(false);
                        }
                      }}
                    >
                      {verifyingLeetCode ? 'Verifying...' : 'Verify'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codechefHandle">CodeChef Handle</Label>
                <div className="flex gap-2">
                  <Input
                    id="codechefHandle"
                    value={formData.codechefHandle}
                    onChange={(e) => setFormData({ ...formData, codechefHandle: e.target.value })}
                    placeholder="your_codechef_handle"
                    className="flex-1"
                  />
                  {formData.codechefHandle && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={verifyingCodeChef}
                      onClick={async () => {
                        setVerifyingCodeChef(true);
                        try {
                          const data = await scrapeCodeChef(formData.codechefHandle);
                          if (data.success) {
                            toast.success(`Found profile! Solved ${data.problemsSolved} problems${data.rating > 0 ? `, Rating: ${data.rating}` : ''}`);
                          } else {
                            toast.error('Profile not found or private');
                          }
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to verify CodeChef profile');
                        } finally {
                          setVerifyingCodeChef(false);
                        }
                      }}
                    >
                      {verifyingCodeChef ? 'Verifying...' : 'Verify'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-streak border-0 text-white">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

