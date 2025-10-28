const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }


  async googleLogin(googleData) {
    const response = await fetch(`${this.baseURL}/auth/google`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(googleData)
    });
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // User endpoints
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async updateProfile(profileData) {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return this.handleResponse(response);
  }

  async completeOnboarding(onboardingData) {
    const response = await fetch(`${this.baseURL}/users/onboard`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(onboardingData)
    });
    return this.handleResponse(response);
  }

  async updateStreak(streakData) {
    const response = await fetch(`${this.baseURL}/users/streak`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(streakData)
    });
    return this.handleResponse(response);
  }

  async addFriend(friendId) {
    const response = await fetch(`${this.baseURL}/users/friends/${friendId}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getFriends() {
    const response = await fetch(`${this.baseURL}/users/friends`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Leaderboard endpoints
  async getGlobalLeaderboard(limit = 50, sortBy = 'streak') {
    const response = await fetch(`${this.baseURL}/leaderboards/global?limit=${limit}&sortBy=${sortBy}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCollegeLeaderboard(limit = 50, sortBy = 'streak') {
    const response = await fetch(`${this.baseURL}/leaderboards/college?limit=${limit}&sortBy=${sortBy}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getDepartmentLeaderboard(limit = 50, sortBy = 'streak') {
    const response = await fetch(`${this.baseURL}/leaderboards/department?limit=${limit}&sortBy=${sortBy}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getUserRank(type = 'global') {
    const response = await fetch(`${this.baseURL}/leaderboards/rank?type=${type}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Challenge endpoints
  async getDailyChallenge() {
    const response = await fetch(`${this.baseURL}/challenges/daily`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async submitChallenge(challengeData) {
    const response = await fetch(`${this.baseURL}/challenges/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(challengeData)
    });
    return this.handleResponse(response);
  }

  async getChallengeHistory() {
    const response = await fetch(`${this.baseURL}/challenges/history`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return this.handleResponse(response);
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  }
}

const apiService = new ApiService();
export default apiService;
