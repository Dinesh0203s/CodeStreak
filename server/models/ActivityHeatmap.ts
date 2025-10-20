import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityHeatmap extends Document {
  userId: mongoose.Types.ObjectId;
  firebaseUid: string;
  date: Date; // Date with time set to 00:00:00
  dateKey: string; // YYYY-MM-DD format for easy querying
  count: number; // Number of problems solved on this date
  sources: {
    app: number; // Submissions from the app
    leetcode: number; // Submissions from LeetCode
    codechef: number; // Submissions from CodeChef
  };
  createdAt: Date;
  updatedAt: Date;
}

const ActivityHeatmapSchema: Schema = new Schema(
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
    date: {
      type: Date,
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    sources: {
      app: {
        type: Number,
        default: 0,
      },
      leetcode: {
        type: Number,
        default: 0,
      },
      codechef: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ActivityHeatmapSchema.index({ firebaseUid: 1, dateKey: 1 }, { unique: true });
ActivityHeatmapSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IActivityHeatmap>('ActivityHeatmap', ActivityHeatmapSchema);
