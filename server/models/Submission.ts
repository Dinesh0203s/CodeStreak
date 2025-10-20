import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  firebaseUid: string; // For quick lookups
  submissionUrl?: string;
  solvedAt: Date;
  timeTaken?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
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
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    submissionUrl: {
      type: String,
    },
    solvedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    timeTaken: {
      type: Number, // in minutes
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user-challenge uniqueness (prevent duplicate submissions)
SubmissionSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

// Index for efficient date range queries
SubmissionSchema.index({ solvedAt: -1 });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);

