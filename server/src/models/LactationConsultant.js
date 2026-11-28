import mongoose from 'mongoose';

const lactationConsultantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    qualification: { type: String, required: true, trim: true, maxlength: 200 },
    bio: { type: String, default: '', maxlength: 2000 },
    languages: [{ type: String, trim: true }],
    timezone: { type: String, default: 'UTC' },
    fee: { type: Number, min: 0 },
    availableDays: [{ type: Number, min: 0, max: 6 }],
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    slotDurationMinutes: { type: Number, default: 60, min: 15, max: 240 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const LactationConsultant =
  mongoose.models.LactationConsultant ||
  mongoose.model('LactationConsultant', lactationConsultantSchema);

export default LactationConsultant;
