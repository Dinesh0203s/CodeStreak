// Use relative path in development (Vite proxy handles it), or full URL from env
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

export interface User {
  _id?: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  fullName?: string;
  college?: string;
  department?: string;
  passoutYear?: string;
  leetcodeHandle?: string;
  codechefHandle?: string;
  role?: 'user' | 'admin' | 'superAdmin' | 'deptAdmin';
  isBanned?: boolean;
  isOnboarded?: boolean;
  currentStreak?: number;
  longestStreak?: number;
  totalProblemsSolved?: number;
  leetcodeStats?: LeetCodeStats & { lastScrapedAt?: string };
  codechefStats?: CodeChefStats & { lastScrapedAt?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface UpdateUserData {
  fullName?: string;
  college?: string;
  department?: string;
  passoutYear?: string;
  leetcodeHandle?: string;
  codechefHandle?: string;
}

// Helper to handle fetch errors
const handleFetchError = async (response: Response, defaultMessage: string) => {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || defaultMessage);
    } catch (e) {
      // If response is not JSON, check for connection errors
      if (response.status === 0 || !response.status) {
        throw new Error('Unable to connect to server. Make sure the backend server is running on port 3000.');
      }
      throw new Error(defaultMessage);
    }
  }
};

// Create or update user (on sign-in)
export const createOrUpdateUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/create-or-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    await handleFetchError(response, 'Failed to create/update user');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get user by Firebase UID
export const getUserByFirebaseUid = async (firebaseUid: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}`);

    if (response.status === 404) {
      throw new Error('User not found');
    }

    await handleFetchError(response, 'Failed to fetch user');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Update user profile (onboarding data)
export const updateUserProfile = async (
  firebaseUid: string,
  userData: UpdateUserData
): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    await handleFetchError(response, 'Failed to update user');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// College API
export interface College {
  _id?: string;
  name: string;
  location?: string;
  departments?: string[];
  isBanned: boolean;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCollegeData {
  name: string;
  location?: string;
  departments?: string[];
}

// Get all colleges
export const getColleges = async (): Promise<College[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/colleges`);
    await handleFetchError(response, 'Failed to fetch colleges');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Create college
export const createCollege = async (collegeData: CreateCollegeData): Promise<College> => {
  try {
    const response = await fetch(`${API_BASE_URL}/colleges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collegeData),
    });

    await handleFetchError(response, 'Failed to create college');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Delete college
export const deleteCollege = async (collegeId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/colleges/${collegeId}`, {
      method: 'DELETE',
    });

    await handleFetchError(response, 'Failed to delete college');
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Ban/Unban college
export const banCollege = async (collegeId: string, isBanned: boolean): Promise<College> => {
  try {
    const response = await fetch(`${API_BASE_URL}/colleges/${collegeId}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isBanned }),
    });

    await handleFetchError(response, 'Failed to update college ban status');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Department Management API (for admins)
// Get departments for a college
export const getCollegeDepartments = async (collegeName: string): Promise<string[]> => {
  try {
    const encodedName = encodeURIComponent(collegeName);
    const response = await fetch(`${API_BASE_URL}/colleges/${encodedName}/departments`);
    await handleFetchError(response, 'Failed to fetch departments');
    const data = await response.json();
    return data.departments || [];
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Add department to college
export const addDepartment = async (collegeName: string, department: string): Promise<College> => {
  try {
    const encodedName = encodeURIComponent(collegeName);
    const response = await fetch(`${API_BASE_URL}/colleges/${encodedName}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ department }),
    });
    await handleFetchError(response, 'Failed to add department');
    const data = await response.json();
    return data.college;
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Update department in college
export const updateDepartment = async (collegeName: string, oldName: string, newName: string): Promise<College> => {
  try {
    const encodedCollegeName = encodeURIComponent(collegeName);
    const encodedOldName = encodeURIComponent(oldName);
    const response = await fetch(`${API_BASE_URL}/colleges/${encodedCollegeName}/departments/${encodedOldName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newName }),
    });
    await handleFetchError(response, 'Failed to update department');
    const data = await response.json();
    return data.college;
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Delete department from college
export const deleteDepartment = async (collegeName: string, departmentName: string): Promise<College> => {
  try {
    const encodedCollegeName = encodeURIComponent(collegeName);
    const encodedDepartmentName = encodeURIComponent(departmentName);
    const response = await fetch(`${API_BASE_URL}/colleges/${encodedCollegeName}/departments/${encodedDepartmentName}`, {
      method: 'DELETE',
    });
    await handleFetchError(response, 'Failed to delete department');
    const data = await response.json();
    return data.college;
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Challenge API
export interface Challenge {
  _id?: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problemUrl: string;
  platform: 'leetcode' | 'codechef' | 'custom';
  problemId?: string;
  tags?: string[];
  date: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  _id?: string;
  userId?: string;
  challengeId?: string | Challenge;
  firebaseUid: string;
  submissionUrl?: string;
  solvedAt: string;
  timeTaken?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  college: string;
  department: string;
  passoutYear?: string;
  streak: number;
  longestStreak: number;
  solved: number;
  avatar?: string;
}

// Get today's challenge
export const getTodayChallenge = async (): Promise<Challenge> => {
  try {
    const response = await fetch(`${API_BASE_URL}/challenges/today`);
    await handleFetchError(response, 'Failed to fetch today\'s challenge');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get all challenges
export const getChallenges = async (page = 1, limit = 20, difficulty?: string, platform?: string): Promise<{
  challenges: Challenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (difficulty) params.append('difficulty', difficulty);
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/challenges?${params}`);
    await handleFetchError(response, 'Failed to fetch challenges');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Check if challenge is solved
export const checkChallengeSolution = async (challengeId: string, firebaseUid: string): Promise<{ solved: boolean; submission: Submission | null }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/check-solution?firebaseUid=${firebaseUid}`);
    await handleFetchError(response, 'Failed to check solution');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Submit solution
export const submitSolution = async (data: {
  firebaseUid: string;
  challengeId: string;
  submissionUrl?: string;
  timeTaken?: number;
}): Promise<Submission> => {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    await handleFetchError(response, 'Failed to submit solution');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get user submissions
export const getUserSubmissions = async (firebaseUid: string, page = 1, limit = 20): Promise<{
  submissions: Submission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await fetch(`${API_BASE_URL}/submissions/user/${firebaseUid}?${params}`);
    await handleFetchError(response, 'Failed to fetch submissions');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get submission heatmap data
export const getSubmissionHeatmap = async (firebaseUid: string): Promise<Array<{ date: string; count: number }>> => {
  try {
    const url = `${API_BASE_URL}/submissions/user/${firebaseUid}/heatmap`;
    console.log('Fetching heatmap data from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Heatmap API error:', response.status, errorText);
      throw new Error(`Failed to fetch heatmap data: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Heatmap data received:', data.length, 'days with activity');
    return data;
  } catch (error: any) {
    console.error('Error fetching heatmap:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get overall leaderboard
export const getOverallLeaderboard = async (limit = 50, sortBy: 'streak' | 'solved' = 'solved'): Promise<LeaderboardEntry[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/overall?limit=${limit}&sortBy=${sortBy}`);
    await handleFetchError(response, 'Failed to fetch leaderboard');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get college leaderboard (grouped by department)
export const getCollegeLeaderboard = async (
  collegeName: string, 
  limit = 50, 
  sortBy: 'streak' | 'solved' = 'solved',
  groupByDepartment = true,
  filters?: { department?: string; passoutYear?: string }
): Promise<{ [department: string]: LeaderboardEntry[] } | LeaderboardEntry[]> => {
  try {
    let url = `${API_BASE_URL}/leaderboard/college/${encodeURIComponent(collegeName)}?limit=${limit}&sortBy=${sortBy}&groupByDepartment=${groupByDepartment}`;
    
    if (filters) {
      if (filters.department && filters.department !== 'all') {
        url += `&department=${encodeURIComponent(filters.department)}`;
      }
      if (filters.passoutYear && filters.passoutYear !== 'all') {
        url += `&passoutYear=${encodeURIComponent(filters.passoutYear)}`;
      }
    }
    
    const response = await fetch(url);
    await handleFetchError(response, 'Failed to fetch college leaderboard');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Get user stats
export const getUserStats = async (firebaseUid: string): Promise<{
  name: string;
  email: string;
  college: string;
  department: string;
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  monthlyGoal: number;
  lastSolvedDate?: string;
  photoURL?: string;
  leetcodeStats?: LeetCodeStats & { lastScrapedAt?: string };
  codechefStats?: CodeChefStats & { lastScrapedAt?: string };
  leetcodeHandle?: string;
  codechefHandle?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/user/${firebaseUid}`);
    await handleFetchError(response, 'Failed to fetch user stats');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Scraping API
export interface LeetCodeStats {
  username: string;
  solvedProblems: number;
  totalProblems: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contestRating: number;
  profileUrl: string;
  success: boolean;
}

export interface CodeChefStats {
  username: string;
  problemsSolved: number;
  rating: number;
  stars: string;
  globalRank: number;
  countryRank: number;
  profileUrl: string;
  success: boolean;
}

// Scrape LeetCode profile
export const scrapeLeetCode = async (username: string): Promise<LeetCodeStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scrape/leetcode/${username}`);
    await handleFetchError(response, 'Failed to scrape LeetCode profile');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Scrape CodeChef profile
export const scrapeCodeChef = async (username: string): Promise<CodeChefStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scrape/codechef/${username}`);
    await handleFetchError(response, 'Failed to scrape CodeChef profile');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Refresh user stats (scrape and save to database)
export const refreshUserStats = async (firebaseUid: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/refresh-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    await handleFetchError(response, 'Failed to refresh stats');
    const data = await response.json();
    return data.user;
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// User Management API (for admins)
// Get all users with optional filters
export const getAllUsers = async (
  callerFirebaseUid: string,
  params?: {
    college?: string;
    role?: 'user' | 'admin' | 'superAdmin' | 'deptAdmin';
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.college) queryParams.append('college', params.college);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    queryParams.append('callerFirebaseUid', callerFirebaseUid);

    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`);
    await handleFetchError(response, 'Failed to fetch users');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Update user role
export const updateUserRole = async (
  callerFirebaseUid: string,
  firebaseUid: string, 
  role: 'user' | 'admin' | 'superAdmin' | 'deptAdmin',
  college?: string,
  department?: string
): Promise<User> => {
  try {
    const body: any = { role, callerFirebaseUid };
    if (role === 'admin' && college) {
      body.college = college;
    }
    if (role === 'deptAdmin' && college && department) {
      body.college = college;
      body.department = department;
    }

    const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    await handleFetchError(response, 'Failed to update user role');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Ban/Unban user
export const banUser = async (callerFirebaseUid: string, firebaseUid: string, isBanned: boolean): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isBanned, callerFirebaseUid }),
    });
    await handleFetchError(response, 'Failed to update user ban status');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};

// Admin update user (for super admin and admin)
export const adminUpdateUser = async (
  callerFirebaseUid: string,
  firebaseUid: string,
  userData: {
    fullName?: string;
    college?: string;
    department?: string;
    passoutYear?: string;
    leetcodeHandle?: string;
    codechefHandle?: string;
    role?: 'user' | 'admin' | 'superAdmin' | 'deptAdmin';
  }
): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUid}/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...userData, callerFirebaseUid }),
    });
    await handleFetchError(response, 'Failed to update user');
    return response.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Backend server is not running. Please start it with: npm run server');
    }
    throw error;
  }
};