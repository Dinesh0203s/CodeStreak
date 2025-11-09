import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Target, Trophy, Users, Bell, TrendingUp, Calendar, Award, UserPlus, ExternalLink, RefreshCw, Code2, ChefHat, Filter } from 'lucide-react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getOverallLeaderboard, getCollegeLeaderboard, getTodayChallenge, LeaderboardEntry, Challenge, refreshUserStats } from '@/lib/api';
import { toast } from 'sonner';
// import { HeatMap } from '@/components/HeatMap';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [leaderboardTab, setLeaderboardTab] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getUserStats>> | null>(null);
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState<{ [department: string]: LeaderboardEntry[] } | LeaderboardEntry[]>({});
  const [allCollegeData, setAllCollegeData] = useState<{ [department: string]: LeaderboardEntry[] } | LeaderboardEntry[]>({});
  const [collegeFilter, setCollegeFilter] = useState<{ department?: string; passoutYear?: string }>({});
  const [error, setError] = useState<string | null>(null);
  // const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number }>>([]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats
        const userStats = await getUserStats(user.uid);
        setStats(userStats);

        // Fetch today's challenge
        try {
          const challenge = await getTodayChallenge();
          setTodayChallenge(challenge);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          // No challenge for today is not an error, just log for debugging
          if (import.meta.env.DEV) {
            console.log('No challenge for today:', errorMessage);
          }
        }

        // Fetch leaderboards (heatmap hidden for now)
        const [overall, college, allCollegeData] = await Promise.allSettled([
          getOverallLeaderboard(10).catch((err) => {
            console.error('Error fetching overall leaderboard:', err);
            return [];
          }),
          userStats.college && userStats.college !== 'N/A' 
            ? getCollegeLeaderboard(userStats.college, 50, 'solved', true, collegeFilter).catch((err) => {
                console.error('Error fetching college leaderboard:', err);
                return {};
              })
            : Promise.resolve({}),
          // Fetch all data (no filters) to get available departments and years for filter options
          userStats.college && userStats.college !== 'N/A' 
            ? getCollegeLeaderboard(userStats.college, 1000, 'solved', true, {}).catch((err) => {
                console.error('Error fetching all college data:', err);
                return {};
              })
            : Promise.resolve({}),
          // getSubmissionHeatmap(user.uid).catch((error) => {
          //   console.error('Failed to fetch heatmap data:', error);
          //   toast.error('Failed to load activity heatmap. Please try refreshing.');
          //   return [];
          // }),
        ]);
        
        setOverallLeaderboard(overall.status === 'fulfilled' ? overall.value : []);
        setCollegeLeaderboard(college.status === 'fulfilled' ? college.value : {});
        setAllCollegeData(allCollegeData.status === 'fulfilled' ? allCollegeData.value : {});
        setError(null);
        // setHeatmapData(heatmap);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
        console.error('Error fetching dashboard data:', errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, collegeFilter, authLoading, navigate]);

  // Extract available departments and years from all college data (unfiltered)
  // This hook MUST be called before any conditional returns to follow Rules of Hooks
  const { availableDepartments, availableYears } = useMemo(() => {
    const isGrouped = !Array.isArray(allCollegeData);
    const groupedData = isGrouped ? allCollegeData as { [department: string]: LeaderboardEntry[] } : null;
    const flatData = !isGrouped ? allCollegeData as LeaderboardEntry[] : null;

    const departments = new Set<string>();
    const years = new Set<string>();

    if (groupedData) {
      Object.keys(groupedData).forEach(dept => {
        if (dept && dept !== 'N/A' && dept !== 'Other') {
          departments.add(dept);
        }
        groupedData[dept].forEach(entry => {
          if (entry.passoutYear && entry.passoutYear !== 'N/A') {
            years.add(entry.passoutYear);
          }
        });
      });
    } else if (flatData) {
      flatData.forEach(entry => {
        if (entry.department && entry.department !== 'N/A') {
          departments.add(entry.department);
        }
        if (entry.passoutYear && entry.passoutYear !== 'N/A') {
          years.add(entry.passoutYear);
        }
      });
    }

    return {
      availableDepartments: Array.from(departments).sort(),
      availableYears: Array.from(years).sort((a, b) => b.localeCompare(a)), // Sort years descending
    };
  }, [allCollegeData]);

  // All hooks must be called before conditional returns
  if (authLoading || loading || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-streak mx-auto mb-4"></div>
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const formatLastSolved = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const currentUserRank = overallLeaderboard.findIndex(
    (entry) => entry.email === stats.email
  ) + 1;

  const handleSolveChallenge = () => {
    if (todayChallenge?._id) {
      navigate(`/challenge/${todayChallenge._id}`);
    } else {
      toast.info('No challenge available for today');
    }
  };

  const handleRefreshStats = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      toast.info('Refreshing stats... This may take a moment.');
      
      const updatedUser = await refreshUserStats(user.uid);
      
      // Refresh the stats by fetching again
      const userStats = await getUserStats(user.uid);
      setStats(userStats);
      
      toast.success('Stats refreshed successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh stats';
      console.error('Error refreshing stats:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const formatScrapedDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {stats.name}! 🎯</h1>
            <p className="text-muted-foreground">Keep the momentum going. You're doing great!</p>
          </div>
          {(stats.leetcodeHandle || stats.codechefHandle) && (
            <Button
              variant="outline"
              onClick={handleRefreshStats}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Stats'}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Streak Card - Hidden for now */}
            {/* <Card className="p-6 bg-gradient-to-br from-card to-streak/5 border-streak/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Streak</h2>
                <Flame className="h-8 w-8 text-streak animate-pulse" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-streak mb-1">{stats.currentStreak || 0}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-challenge mb-1">{stats.longestStreak || 0}</div>
                  <div className="text-sm text-muted-foreground">Longest Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-success mb-1">{stats.totalSolved || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Solved</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  Last solved: {formatLastSolved(stats.lastSolvedDate)}
                </div>
                {todayChallenge ? (
                  <Button 
                    onClick={handleSolveChallenge}
                    className="w-full bg-gradient-streak border-0 text-white hover:opacity-90"
                  >
                    Solve Today's Challenge
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    No Challenge Available Today
                  </Button>
                )}
              </div>
            </Card> */}

            {/* Monthly Goal - Hidden for now */}
            {/* <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-challenge" />
                  <h3 className="text-xl font-semibold">Monthly Goal</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {stats.totalSolved || 0}/{stats.monthlyGoal || 20} problems
                </span>
              </div>

              <Progress 
                value={Math.min(((stats.totalSolved || 0) / (stats.monthlyGoal || 20)) * 100, 100)} 
                className="mb-2" 
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {Math.max(0, (stats.monthlyGoal || 20) - (stats.totalSolved || 0))} more to reach your goal
                </span>
                <span className="text-success font-medium">
                  {Math.round(((stats.totalSolved || 0) / (stats.monthlyGoal || 20)) * 100)}%
                </span>
              </div>
            </Card> */}

            {/* Activity Heat Map - Hidden for now */}
            {/* <HeatMap 
              data={heatmapData} 
              longestStreak={stats?.longestStreak || 0}
              totalProblemsSolved={stats?.totalSolved || 0}
            /> */}

            {/* Platform Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* LeetCode Stats */}
              {stats.leetcodeHandle && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-orange-500" />
                      <h3 className="text-xl font-semibold">LeetCode</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshStats}
                      disabled={refreshing}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {stats.leetcodeStats ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Handle</span>
                        <a
                          href={stats.leetcodeStats.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-orange-500 hover:underline"
                        >
                          @{stats.leetcodeStats.username}
                        </a>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-orange-500">
                            {stats.leetcodeStats.solvedProblems}
                          </div>
                          <div className="text-xs text-muted-foreground">Solved</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.leetcodeStats.ranking || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Rank</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{stats.leetcodeStats.easySolved}</div>
                          <div className="text-xs text-muted-foreground">Easy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-yellow-600">{stats.leetcodeStats.mediumSolved}</div>
                          <div className="text-xs text-muted-foreground">Medium</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">{stats.leetcodeStats.hardSolved}</div>
                          <div className="text-xs text-muted-foreground">Hard</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        Last updated: {formatScrapedDate(stats.leetcodeStats.lastScrapedAt)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">No data available</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshStats}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Scrape Now
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* CodeChef Stats */}
              {stats.codechefHandle && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-orange-600" />
                      <h3 className="text-xl font-semibold">CodeChef</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshStats}
                      disabled={refreshing}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {stats.codechefStats ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Handle</span>
                        <a
                          href={stats.codechefStats.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-orange-600 hover:underline"
                        >
                          @{stats.codechefStats.username}
                        </a>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {stats.codechefStats.problemsSolved}
                          </div>
                          <div className="text-xs text-muted-foreground">Solved</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.codechefStats.rating || 'Unrated'}</div>
                          <div className="text-xs text-muted-foreground">Rating</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{stats.codechefStats.globalRank || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Global Rank</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{stats.codechefStats.countryRank || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">Country Rank</div>
                        </div>
                      </div>
                      {stats.codechefStats.stars && (
                        <div className="text-center pt-2 border-t border-border">
                          <div className="text-sm font-medium text-orange-600">{stats.codechefStats.stars}</div>
                          <div className="text-xs text-muted-foreground">Stars</div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        Last updated: {formatScrapedDate(stats.codechefStats.lastScrapedAt)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">No data available</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshStats}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Scrape Now
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Today's Challenge Preview */}
            {todayChallenge && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Today's Challenge</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-lg">{todayChallenge.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{todayChallenge.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      todayChallenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-600' :
                      todayChallenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                      'bg-red-500/20 text-red-600'
                    }`}>
                      {todayChallenge.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {todayChallenge.platform}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSolveChallenge}
                      className="flex-1 bg-gradient-streak border-0 text-white"
                    >
                      Solve Challenge
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(todayChallenge.problemUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Problem
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-challenge" />
                <h2 className="text-lg font-semibold">Leaderboard</h2>
              </div>
              
              <Tabs value={leaderboardTab} onValueChange={setLeaderboardTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="overall" className="flex-1">Overall</TabsTrigger>
                  <TabsTrigger value="college" className="flex-1" disabled={!stats.college || stats.college === 'N/A'}>
                    My College
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overall" className="space-y-2 mt-0 max-h-96 overflow-y-auto">
                  {overallLeaderboard.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No leaderboard data available
                    </div>
                  ) : (
                    overallLeaderboard.map((userEntry) => {
                      const isCurrentUser = userEntry.email === stats.email;
                      return (
                        <div 
                          key={userEntry.rank} 
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-gradient-streak/10 border border-streak' 
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            userEntry.rank === 1 ? 'bg-yellow-500 text-white' :
                            userEntry.rank === 2 ? 'bg-gray-400 text-white' :
                            userEntry.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {userEntry.rank}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userEntry.avatar} />
                            <AvatarFallback>{userEntry.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {userEntry.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-streak">(You)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{userEntry.college}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-streak font-semibold text-sm">
                              <Flame className="h-3 w-3" />
                              {userEntry.streak}
                            </div>
                            <div className="text-xs text-muted-foreground">{userEntry.solved}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="college" className="space-y-4 mt-0 max-h-96 overflow-y-auto">
                  <div className="mb-3 space-y-3">
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">{stats.college}</p>
                    </div>
                    {/* Filter Controls */}
                    <div className="flex gap-2 items-center">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={collegeFilter.department || 'all'}
                        onValueChange={(value) => {
                          setCollegeFilter(prev => ({
                            ...prev,
                            department: value === 'all' ? undefined : value,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {availableDepartments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={collegeFilter.passoutYear || 'all'}
                        onValueChange={(value) => {
                          setCollegeFilter(prev => ({
                            ...prev,
                            passoutYear: value === 'all' ? undefined : value,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(collegeFilter.department || collegeFilter.passoutYear) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setCollegeFilter({})}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  {(() => {
                    // Check if collegeLeaderboard is grouped by department (object) or flat (array)
                    const isGrouped = !Array.isArray(collegeLeaderboard);
                    const groupedData = isGrouped ? collegeLeaderboard as { [department: string]: LeaderboardEntry[] } : null;
                    const flatData = !isGrouped ? collegeLeaderboard as LeaderboardEntry[] : null;

                    if (isGrouped && groupedData) {
                      const departments = Object.keys(groupedData).sort();
                      
                      if (departments.length === 0) {
                        return (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No college leaderboard data available
                          </div>
                        );
                      }

                      return departments.map((department) => {
                        const users = groupedData[department];
                        if (users.length === 0) return null;

                        return (
                          <div key={department} className="space-y-2">
                            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-2 py-2 border-b border-border">
                              <h3 className="text-sm font-semibold text-primary">{department}</h3>
                            </div>
                            {users.map((userEntry) => {
                              const isCurrentUser = userEntry.email === stats.email;
                              return (
                                <div 
                                  key={`${department}-${userEntry.rank}`} 
                                  className={`flex items-center gap-3 p-3 rounded-lg ${
                                    isCurrentUser 
                                      ? 'bg-gradient-streak/10 border border-streak' 
                                      : 'bg-muted/50'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    userEntry.rank === 1 ? 'bg-yellow-500 text-white' :
                                    userEntry.rank === 2 ? 'bg-gray-400 text-white' :
                                    userEntry.rank === 3 ? 'bg-amber-600 text-white' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {userEntry.rank}
                                  </div>
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={userEntry.avatar} />
                                    <AvatarFallback>{userEntry.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {userEntry.name}
                                      {isCurrentUser && (
                                        <span className="ml-2 text-xs text-streak">(You)</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1 text-streak font-semibold text-sm">
                                      <Flame className="h-3 w-3" />
                                      {userEntry.streak}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{userEntry.solved}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    } else if (flatData) {
                      // Fallback to flat display for backward compatibility
                      if (flatData.length === 0) {
                        return (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No college leaderboard data available
                          </div>
                        );
                      }

                      return flatData.map((userEntry) => {
                        const isCurrentUser = userEntry.email === stats.email;
                        return (
                          <div 
                            key={userEntry.rank} 
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              isCurrentUser 
                                ? 'bg-gradient-streak/10 border border-streak' 
                                : 'bg-muted/50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              userEntry.rank === 1 ? 'bg-yellow-500 text-white' :
                              userEntry.rank === 2 ? 'bg-gray-400 text-white' :
                              userEntry.rank === 3 ? 'bg-amber-600 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {userEntry.rank}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userEntry.avatar} />
                              <AvatarFallback>{userEntry.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {userEntry.name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-streak">(You)</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{userEntry.department}</div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-streak font-semibold text-sm">
                                <Flame className="h-3 w-3" />
                                {userEntry.streak}
                              </div>
                              <div className="text-xs text-muted-foreground">{userEntry.solved}</div>
                            </div>
                          </div>
                        );
                      });
                    }

                    return (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No college leaderboard data available
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
