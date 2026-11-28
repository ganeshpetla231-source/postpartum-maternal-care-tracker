import mongoose from 'mongoose';

const forumReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true, index: true },
    targetType: { type: String, enum: ['post', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    action: { type: String, enum: ['hide', 'warn', 'dismiss'] }
  },
  { timestamps: true }
);

const ForumReport =
  mongoose.models.ForumReport || mongoose.model('ForumReport', forumReportSchema);

export default ForumReport;
