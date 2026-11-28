import mongoose from 'mongoose';

const babyLogSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    baby: { type: mongoose.Schema.Types.ObjectId, ref: 'Baby', required: true },
    type: {
      type: String,
      enum: ['feed', 'sleep', 'diaper'],
      required: true
    },
    feed: {
      method: { type: String, trim: true },
      amountMl: { type: Number },
      durationMin: { type: Number },
      side: { type: String, trim: true }
    },
    sleep: {
      start: { type: Date },
      end: { type: Date }
    },
    diaper: {
      kind: { type: String, enum: ['wet', 'dirty', 'both'] }
    },
    loggedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

babyLogSchema.index({ mother: 1, baby: 1, loggedAt: -1 });

const BabyLog = mongoose.models.BabyLog || mongoose.model('BabyLog', babyLogSchema);

export default BabyLog;
