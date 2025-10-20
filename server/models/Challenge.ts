import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problemUrl: string;
  platform: 'leetcode' | 'codechef' | 'custom';
  problemId?: string; // External platform problem ID
  tags?: string[];
  date: Date; // Challenge date (for daily challenges)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    problemUrl: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codechef', 'custom'],
      required: true,
    },
    problemId: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient date queries
ChallengeSchema.index({ date: 1, isActive: 1 });

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);

