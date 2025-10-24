import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Flame, 
  Target, 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ThemeToggle from '../ThemeToggle';

const Dashboard = () => {
  const { userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const weeklyData = [
    { day: 'Mon', problems: 3, streak: 1 },
    { day: 'Tue', problems: 5, streak: 2 },
    { day: 'Wed', problems: 2, streak: 3 },
    { day: 'Thu', problems: 7, streak: 4 },
    { day: 'Fri', problems: 4, streak: 5 },
    { day: 'Sat', problems: 6, streak: 6 },
    { day: 'Sun', problems: 8, streak: 7 },
  ];

  const monthlyData = [
    { week: 'Week 1', problems: 25 },
    { week: 'Week 2', problems: 32 },
    { week: 'Week 3', problems: 28 },
    { week: 'Week 4', problems: 35 },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-8 h-8 text-primary-500" />
                <h1 className="text-xl font-bold">CodeStreak</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {userProfile.displayName || 'Coder'}! 🔥
          </h2>
          <p className="text-dark-400">
            Keep your streak alive and climb the leaderboards
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card streak-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-primary-500">{userProfile.streak || 0}</p>
                <p className="text-xs text-dark-400">days</p>
              </div>
              <Flame className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Total Problems</p>
                <p className="text-3xl font-bold text-green-500">{userProfile.totalProblems || 0}</p>
                <p className="text-xs text-dark-400">solved</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Longest Streak</p>
                <p className="text-3xl font-bold text-purple-500">{userProfile.longestStreak || 0}</p>
                <p className="text-xs text-dark-400">days</p>
              </div>
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">XP Points</p>
                <p className="text-3xl font-bold text-yellow-500">{userProfile.xp || 0}</p>
                <p className="text-xs text-dark-400">Level {userProfile.level || 1}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-dark-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'challenges', label: 'Challenges', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Progress Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="problems" 
                    stroke="#0EA5E9" 
                    strokeWidth={3}
                    dot={{ fill: '#0EA5E9', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Progress Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Monthly Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Bar dataKey="problems" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Your Friends</h3>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">No friends yet. Start building your coding network!</p>
              <button className="btn-primary mt-4">Add Friends</button>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Leaderboards</h3>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">Leaderboards coming soon!</p>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Daily Challenges</h3>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">Daily challenges coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
