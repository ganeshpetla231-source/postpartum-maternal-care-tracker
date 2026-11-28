import mongoose from 'mongoose';

const escalationSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    reason: { type: String, required: true, maxlength: 1000 },
    severity: { type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'in-progress', 'resolved'],
      default: 'open'
    }
  },
  { timestamps: true }
);

const Escalation =
  mongoose.models.Escalation || mongoose.model('Escalation', escalationSchema);

export default Escalation;
