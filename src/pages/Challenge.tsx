import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ExternalLink, CheckCircle2, Clock, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getChallenges, getTodayChallenge, checkChallengeSolution, submitSolution, Challenge } from '@/lib/api';
import { toast } from 'sonner';

const ChallengePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [timeTaken, setTimeTaken] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchChallenge = async () => {
      try {
        setLoading(true);
        let foundChallenge: Challenge | null = null;
        
        if (id === 'today') {
          // Try to get today's challenge
          try {
            foundChallenge = await getTodayChallenge();
          } catch (error: any) {
            if (error.message.includes('404') || error.message.includes('not found')) {
              toast.error('No challenge available for today');
              navigate('/dashboard');
              return;
            }
            throw error;
          }
        } else {
          // Fetch challenge by ID
          const challenges = await getChallenges(1, 100);
          foundChallenge = challenges.challenges.find(c => c._id === id) || null;
        }
        
        if (!foundChallenge) {
          toast.error('Challenge not found');
          navigate('/dashboard');
          return;
        }

        setChallenge(foundChallenge);

        // Check if already solved
        const checkResult = await checkChallengeSolution(foundChallenge._id!, user.uid);
        setIsSolved(checkResult.solved);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load challenge');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, user, navigate]);

  const handleSubmit = async () => {
    if (!challenge?._id || !user) return;

    if (!submissionUrl.trim()) {
      toast.error('Please provide a submission URL');
      return;
    }

    setSubmitting(true);
    try {
      await submitSolution({
        firebaseUid: user.uid,
        challengeId: challenge._id,
        submissionUrl: submissionUrl.trim(),
        timeTaken: timeTaken ? parseFloat(timeTaken) : undefined,
      });

      setIsSolved(true);
      toast.success('Solution submitted successfully! Your streak has been updated.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      if (error.message.includes('already solved')) {
        setIsSolved(true);
        toast.info('You have already solved this challenge');
      } else {
        toast.error(error.message || 'Failed to submit solution');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">Loading challenge...</div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Challenge not found</h2>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </Card>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-600 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{challenge.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyColors[challenge.difficulty]}`}>
                  {challenge.difficulty.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground capitalize">
                  {challenge.platform}
                </span>
              </div>
            </div>
            {isSolved && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Solved</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{challenge.description}</p>
          </div>

          {challenge.tags && challenge.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {challenge.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-muted text-sm text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => window.open(challenge.problemUrl, '_blank')}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Problem on {challenge.platform === 'leetcode' ? 'LeetCode' : challenge.platform === 'codechef' ? 'CodeChef' : 'Platform'}
            </Button>
          </div>

          {!isSolved && (
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold mb-4">Submit Your Solution</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submissionUrl">
                    Submission URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="submissionUrl"
                    placeholder="https://leetcode.com/submissions/detail/..."
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the URL to your submission on the platform
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeTaken">Time Taken (minutes, optional)</Label>
                  <Input
                    id="timeTaken"
                    type="number"
                    placeholder="30"
                    value={timeTaken}
                    onChange={(e) => setTimeTaken(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !submissionUrl.trim()}
                  className="w-full bg-gradient-streak border-0 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </Button>
              </div>
            </div>
          )}

          {isSolved && (
            <div className="mt-8 pt-8 border-t border-border">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Challenge Completed!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You have successfully solved this challenge. Your streak and statistics have been updated.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChallengePage;

