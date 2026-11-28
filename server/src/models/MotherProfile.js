import mongoose from 'mongoose';

const motherProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    deliveryDate: { type: Date },
    deliveryType: { type: String, enum: ['normal', 'c-section'], default: 'normal' },
    complications: [{ type: String }],
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

const MotherProfile = mongoose.models.MotherProfile || mongoose.model('MotherProfile', motherProfileSchema);

export default MotherProfile;
