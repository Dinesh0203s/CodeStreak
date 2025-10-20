import mongoose, { Schema, Document } from 'mongoose';

export interface ICollege extends Document {
  name: string;
  location?: string;
  departments?: string[];
  isBanned: boolean;
  studentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CollegeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    departments: {
      type: [String],
      default: [],
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICollege>('College', CollegeSchema);

