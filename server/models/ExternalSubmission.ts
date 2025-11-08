import mongoose, { Schema, Document } from 'mongoose';

export interface IExternalSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  firebaseUid: string;
  platform: 'leetcode' | 'codechef';
  problemTitle: string;
  problemSlug?: string; // LeetCode slug
  problemUrl?: string;
  submissionId?: string; // Platform-specific submission ID
  timestamp: Date; // When the problem was solved
  language?: string; // Programming language used
  status?: string; // Status (e.g., "Accepted")
  difficulty?: 'Easy' | 'Medium' | 'Hard'; // Problem difficulty (for LeetCode)
  createdAt: Date;
  updatedAt: Date;
}

const ExternalSubmissionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codechef'],
      required: true,
      index: true,
    },
    problemTitle: {
      type: String,
      required: true,
    },
    problemSlug: {
      type: String,
    },
    problemUrl: {
      type: String,
    },
    submissionId: {
      type: String,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    language: {
      type: String,
    },
    status: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user-platform-submission uniqueness
ExternalSubmissionSchema.index({ firebaseUid: 1, platform: 1, submissionId: 1 }, { unique: true, sparse: true });
// Index for efficient date queries
ExternalSubmissionSchema.index({ firebaseUid: 1, timestamp: -1 });
// Index for platform-specific queries
ExternalSubmissionSchema.index({ platform: 1, timestamp: -1 });

export default mongoose.model<IExternalSubmission>('ExternalSubmission', ExternalSubmissionSchema);





