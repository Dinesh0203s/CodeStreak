import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, Code, Target, Users, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    college: '',
    department: '',
    codingHandles: {
      leetcode: '',
      codechef: '',
      hackerrank: ''
    },
    reminderTime: '09:00',
    monthlyTarget: 30
  });
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('codingHandles.')) {
      const handleType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        codingHandles: {
          ...prev.codingHandles,
          [handleType]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({
        college: formData.college,
        department: formData.department,
        codingHandles: formData.codingHandles,
        reminderTime: formData.reminderTime,
        monthlyTarget: formData.monthlyTarget,
        isOnboarded: true
      });
      toast.success('Welcome to CodeStreak! Your profile is set up.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error completing setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colleges = [
    'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
    'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'NIT Trichy', 'NIT Surathkal',
    'BITS Pilani', 'IIIT Hyderabad', 'IIIT Bangalore', 'Other'
  ];

  const departments = [
    'Computer Science', 'Information Technology', 'Electronics', 'Mechanical',
    'Civil', 'Electrical', 'Chemical', 'Aerospace', 'Other'
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-dark-400'
                  }`}
                >
                  {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
                </div>
              ))}
            </div>
            <span className="text-dark-400 text-sm">Step {step} of 4</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          {/* Step 1: College & Department */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <GraduationCap className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Tell us about your college</h2>
                <p className="text-dark-400">This helps us connect you with your peers</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  College/University
                </label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select your college</option>
                  {colleges.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select your department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Coding Handles */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Code className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Connect your coding profiles</h2>
                <p className="text-dark-400">Link your accounts to track your progress automatically</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    LeetCode Username
                  </label>
                  <input
                    type="text"
                    name="codingHandles.leetcode"
                    value={formData.codingHandles.leetcode}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your LeetCode username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    CodeChef Username
                  </label>
                  <input
                    type="text"
                    name="codingHandles.codechef"
                    value={formData.codingHandles.codechef}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your CodeChef username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    HackerRank Username
                  </label>
                  <input
                    type="text"
                    name="codingHandles.hackerrank"
                    value={formData.codingHandles.hackerrank}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your HackerRank username"
                  />
                </div>
              </div>

              <div className="bg-dark-700 p-4 rounded-lg">
                <p className="text-sm text-dark-300">
                  💡 <strong>Tip:</strong> You can add these later in your profile settings if you don't have them now.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Targets */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Target className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Set your goals</h2>
                <p className="text-dark-400">Define what success looks like for you</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Monthly Target (Problems to solve)
                </label>
                <input
                  type="number"
                  name="monthlyTarget"
                  value={formData.monthlyTarget}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  max="1000"
                />
                <p className="text-sm text-dark-400 mt-1">
                  How many problems do you want to solve this month?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  name="reminderTime"
                  value={formData.reminderTime}
                  onChange={handleChange}
                  className="input-field"
                />
                <p className="text-sm text-dark-400 mt-1">
                  When would you like to be reminded to code daily?
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Social Features */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Users className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Connect with friends</h2>
                <p className="text-dark-400">Build your coding community and stay motivated together</p>
              </div>

              <div className="space-y-4">
                <div className="bg-dark-700 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2">🏆 Leaderboards</h3>
                  <p className="text-sm text-dark-300">
                    Compete with friends and college peers on global, college, and department leaderboards.
                  </p>
                </div>

                <div className="bg-dark-700 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2">👥 Friends Network</h3>
                  <p className="text-sm text-dark-300">
                    Add friends, cheer them on, and get motivated by their progress.
                  </p>
                </div>

                <div className="bg-dark-700 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2">🔔 Smart Reminders</h3>
                  <p className="text-sm text-dark-300">
                    Get SMS, call, and app notifications to maintain your streak.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>{loading ? 'Setting up...' : 'Complete Setup'}</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
