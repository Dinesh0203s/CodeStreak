// Mock User model for development without MongoDB
class MockUser {
  constructor(data) {
    this._id = data._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.email = data.email;
    this.displayName = data.displayName;
    this.photoURL = data.photoURL || '';
    this.provider = data.provider || 'google';
    this.googleId = data.googleId;
    this.college = data.college || '';
    this.department = data.department || '';
    this.codingHandles = data.codingHandles || {};
    this.streak = data.streak || 0;
    this.totalProblems = data.totalProblems || 0;
    this.longestStreak = data.longestStreak || 0;
    this.xp = data.xp || 0;
    this.level = data.level || 1;
    this.friends = data.friends || [];
    this.isOnboarded = data.isOnboarded || false;
    this.reminderTime = data.reminderTime || '09:00';
    this.monthlyTarget = data.monthlyTarget || 30;
    this.lastActiveDate = data.lastActiveDate || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getProfile() {
    const profile = { ...this };
    delete profile.password;
    return profile;
  }

  comparePassword(password) {
    return Promise.resolve(true); // Mock password comparison
  }

  save() {
    // Mock save - in real app this would save to database
    return Promise.resolve(this);
  }

  static findOne(query) {
    // Mock findOne - return null for new users
    return Promise.resolve(null);
  }

  static findByIdAndUpdate(id, update, options) {
    // Mock update - return updated user
    const user = new MockUser({
      _id: id,
      ...update,
      updatedAt: new Date()
    });
    return Promise.resolve(user);
  }

  static findById(id) {
    // Mock findById - return user if exists
    return Promise.resolve(new MockUser({ _id: id }));
  }
}

module.exports = MockUser;

