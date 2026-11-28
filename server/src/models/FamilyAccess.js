import mongoose from 'mongoose';

const familyAccessSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, select: false },
    expiresAt: Date,
    acceptedAt: Date,
    revokedAt: Date,
    permissions: {
      viewBabyLogs: { type: Boolean, default: false },
      viewRecovery: { type: Boolean, default: false },
      viewMood: { type: Boolean, default: false },
      logBabyData: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

familyAccessSchema.index({ mother: 1, email: 1 });
familyAccessSchema.index({ tokenHash: 1 }, { sparse: true });

const FamilyAccess =
  mongoose.models.FamilyAccess || mongoose.model('FamilyAccess', familyAccessSchema);

export default FamilyAccess;
