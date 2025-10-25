import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);


  const loginWithGoogle = async () => {
    try {
      // Generate a unique Google ID for demo purposes
      const googleId = `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockGoogleData = {
        email: `user${Math.floor(Math.random() * 1000)}@gmail.com`,
        displayName: `Google User ${Math.floor(Math.random() * 100)}`,
        photoURL: `https://ui-avatars.com/api/?name=Google+User&background=0ea5e9&color=fff`,
        googleId: googleId
      };
      
      const response = await apiService.googleLogin(mockGoogleData);
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      setCurrentUser({ uid: response.user._id, email: response.user.email });
      setUserProfile(response.user);
      
      toast.success('Welcome to CodeStreak!');
      return response.user;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Login failed. Please check your internet connection and try again.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local storage and state
      localStorage.removeItem('token');
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!currentUser) return;
      
      const response = await apiService.updateProfile(updates);
      setUserProfile(response.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      return response.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          setCurrentUser({ uid: response.user._id, email: response.user.email });
          setUserProfile(response.user);
        } catch (error) {
          console.warn('Could not verify token:', error);
          localStorage.removeItem('token');
          setCurrentUser(null);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loginWithGoogle,
    logout,
    updateProfile,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
