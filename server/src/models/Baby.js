import mongoose from 'mongoose';

const babySchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, trim: true },
    birthWeight: { type: Number },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

babySchema.index({ mother: 1, name: 1 });

const Baby = mongoose.models.Baby || mongoose.model('Baby', babySchema);

export default Baby;
