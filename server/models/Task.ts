import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  links: string[]; // Array of links to external websites
  assignedTo: string; // firebaseUid of the user
  assignedBy: string; // firebaseUid of the admin who assigned it
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    links: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.length > 0;
        },
        message: 'At least one link is required'
      }
    },
    assignedTo: {
      type: String,
      required: true,
      index: true,
    },
    assignedBy: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
TaskSchema.index({ assignedTo: 1, isCompleted: 1 });
TaskSchema.index({ assignedBy: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);

