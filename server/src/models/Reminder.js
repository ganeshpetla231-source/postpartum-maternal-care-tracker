import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['medication', 'appointment', 'custom'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    dosage: { type: String, trim: true, maxlength: 120 },
    scheduleType: { type: String, enum: ['once', 'daily', 'weekly'], required: true },
    times: [{ type: String }],
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    scheduledAt: Date,
    startDate: Date,
    timezone: { type: String, default: 'UTC' },
    location: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    completionKeys: [{ type: String }]
  },
  { timestamps: true }
);

const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);

export default Reminder;
