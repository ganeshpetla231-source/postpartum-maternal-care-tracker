import mongoose from 'mongoose';

const deidentifiedArchiveSchema = new mongoose.Schema(
  {
    archiveId: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

deidentifiedArchiveSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DeidentifiedArchive =
  mongoose.models.DeidentifiedArchive ||
  mongoose.model('DeidentifiedArchive', deidentifiedArchiveSchema);

export default DeidentifiedArchive;
