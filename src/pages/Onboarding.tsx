import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, School, Code, User, ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, getColleges, scrapeLeetCode, scrapeCodeChef, College } from '@/lib/api';
import { toast } from 'sonner';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [verifyingLeetCode, setVerifyingLeetCode] = useState(false);
  const [verifyingCodeChef, setVerifyingCodeChef] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    college: '',
    department: '',
    passoutYear: '',
    leetcodeHandle: '',
    codechefHandle: '',
  });

  // Check if user is already onboarded
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { getUserByFirebaseUid } = await import('@/lib/api');
        const userData = await getUserByFirebaseUid(user.uid);
        const role = userData.role || 'user';

        // Check if user has completed onboarding
        // User is considered onboarded if:
        // 1. isOnboarded is explicitly true, OR
        // 2. They have both fullName and college (backward compatibility)
        const isOnboarded = userData.isOnboarded === true || (!!userData.fullName && !!userData.college);

        if (isOnboarded) {
          // User is already onboarded, redirect them
          if (role === 'superAdmin') {
            navigate('/super-admin');
          } else if (role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
          return;
        }

        // Pre-fill form with existing data if available
        if (userData.fullName) setFormData(prev => ({ ...prev, fullName: userData.fullName || '' }));
        if (userData.college) setFormData(prev => ({ ...prev, college: userData.college || '' }));
        if (userData.department) setFormData(prev => ({ ...prev, department: userData.department || '' }));
        if (userData.passoutYear) setFormData(prev => ({ ...prev, passoutYear: userData.passoutYear || '' }));
        if (userData.leetcodeHandle) setFormData(prev => ({ ...prev, leetcodeHandle: userData.leetcodeHandle || '' }));
        if (userData.codechefHandle) setFormData(prev => ({ ...prev, codechefHandle: userData.codechefHandle || '' }));
      } catch (error: any) {
        // User might not exist in MongoDB yet, that's okay - they can onboard
        console.log('User data not found, proceeding with onboarding:', error.message);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoadingColleges(true);
        const data = await getColleges();
        setColleges(data);
      } catch (error: any) {
        console.error('Failed to load colleges:', error);
        toast.error('Failed to load colleges. You can still type the college name.');
      } finally {
        setLoadingColleges(false);
      }
    };

    fetchColleges();
  }, []);

  // Get departments for selected college
  const availableDepartments = useMemo(() => {
    const selectedCollege = colleges.find(c => c.name === formData.college);
    return selectedCollege?.departments || [];
  }, [formData.college, colleges]);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding - save to MongoDB
      if (!user) {
        toast.error('You must be signed in to complete onboarding');
        navigate('/auth');
        return;
      }

      setIsSubmitting(true);
      try {
        const updatedUser = await updateUserProfile(user.uid, {
          fullName: formData.fullName,
          college: formData.college,
          department: formData.department,
          passoutYear: formData.passoutYear,
          leetcodeHandle: formData.leetcodeHandle,
          codechefHandle: formData.codechefHandle,
        });
        toast.success('Profile updated successfully!');
        
        // Redirect based on user role
        const role = updatedUser.role || 'user';
        if (role === 'superAdmin') {
          navigate('/super-admin');
        } else if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'deptAdmin') {
          navigate('/dept-admin');
        } else {
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast.error(error.message || 'Failed to save profile');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.fullName.trim() !== '';
      case 2:
        return formData.college.trim() !== '' && formData.department.trim() !== '' && formData.passoutYear.trim() !== '';
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-streak mx-auto mb-4"></div>
          <div>Checking onboarding status...</div>
        </div>
      </div>
    );
  }

  // Don't show onboarding if user is not logged in (should be handled by redirect above, but just in case)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 bg-card border-border shadow-card">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Flame className="h-8 w-8 text-streak animate-pulse" />
            <span className="text-2xl font-bold">Welcome to CodeStreak!</span>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-gradient-streak' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="h-12 w-12 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                <p className="text-muted-foreground">Let's start with your basic information</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: College Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <School className="h-12 w-12 text-challenge mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-2">Your College Details</h2>
                <p className="text-muted-foreground">Join your college community</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="college">College Name <span className="text-destructive">*</span></Label>
                  {loadingColleges ? (
                    <Input
                      id="college"
                      placeholder="Loading colleges..."
                      disabled
                    />
                  ) : (
                    <Select 
                      value={formData.college} 
                      onValueChange={(value) => {
                        updateFormData('college', value);
                        updateFormData('department', ''); // Reset department when college changes
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
                            No colleges available. Please contact an admin to add your college.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Only admin-created colleges are available. Contact an admin if your college is missing.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => updateFormData('department', value)}
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
                  {formData.college && availableDepartments.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      This college has no departments configured. Contact an admin to add departments.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passoutYear">Passout Year</Label>
                  <Select 
                    value={formData.passoutYear} 
                    onValueChange={(value) => updateFormData('passoutYear', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select passout year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Coding Profiles */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Code className="h-12 w-12 text-success mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-2">Connect Your Profiles</h2>
                <p className="text-muted-foreground">Link your coding accounts to track progress (optional)</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leetcode">LeetCode Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="leetcode"
                      placeholder="your_leetcode_handle"
                      value={formData.leetcodeHandle}
                      onChange={(e) => updateFormData('leetcodeHandle', e.target.value)}
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
                  <Label htmlFor="codechef">CodeChef Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="codechef"
                      placeholder="your_codechef_handle"
                      value={formData.codechefHandle}
                      onChange={(e) => updateFormData('codechefHandle', e.target.value)}
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

              <div className="text-sm text-muted-foreground text-center">
                You can always add these later in settings
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className="flex-1 bg-gradient-streak border-0 text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting 
                ? 'Saving...' 
                : step === 3 
                  ? 'Complete Setup' 
                  : 'Continue'}
              {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
