import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
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
  currentStreak: number;
  longestStreak: number;
  totalProblemsSolved: number;
  lastSolvedDate?: Date;
  monthlyGoal?: number;
  leetcodeStats?: {
    username: string;
    solvedProblems: number;
    totalProblems: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    contestRating: number;
    profileUrl: string;
    lastScrapedAt?: Date;
    submissionDates?: Array<{ date: string; count: number }>; // Actual submission dates
  };
  codechefStats?: {
    username: string;
    problemsSolved: number;
    rating: number;
    stars: string;
    globalRank: number;
    countryRank: number;
    profileUrl: string;
    lastScrapedAt?: Date;
    submissionDates?: Array<{ date: string; count: number }>; // Actual submission dates
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
    },
    fullName: {
      type: String,
    },
    college: {
      type: String,
    },
    department: {
      type: String,
    },
    passoutYear: {
      type: String,
    },
    leetcodeHandle: {
      type: String,
    },
    codechefHandle: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superAdmin', 'deptAdmin'],
      default: 'user',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    totalProblemsSolved: {
      type: Number,
      default: 0,
    },
    lastSolvedDate: {
      type: Date,
    },
    monthlyGoal: {
      type: Number,
      default: 20,
    },
    leetcodeStats: {
      type: {
        username: String,
        solvedProblems: Number,
        totalProblems: Number,
        easySolved: Number,
        mediumSolved: Number,
        hardSolved: Number,
        ranking: Number,
        contestRating: Number,
        profileUrl: String,
        lastScrapedAt: Date,
        submissionDates: [{
          date: String,
          count: Number,
        }],
      },
    },
    codechefStats: {
      type: {
        username: String,
        problemsSolved: Number,
        rating: Number,
        stars: String,
        globalRank: Number,
        countryRank: Number,
        profileUrl: String,
        lastScrapedAt: Date,
        submissionDates: [{
          date: String,
          count: Number,
        }],
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);

