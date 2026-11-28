import mongoose from 'mongoose';

const recoveryMilestoneSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['physical', 'emotional', 'wound', 'mobility', 'nutrition'],
      default: 'physical'
    },
    targetDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'done'],
      default: 'pending'
    },
    painLevel: { type: Number, min: 0, max: 10 },
    notes: { type: String, trim: true },
    completedAt: { type: Date },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

recoveryMilestoneSchema.index({ mother: 1, status: 1, category: 1, targetDate: 1 });

const RecoveryMilestone =
  mongoose.models.RecoveryMilestone || mongoose.model('RecoveryMilestone', recoveryMilestoneSchema);

export default RecoveryMilestone;
