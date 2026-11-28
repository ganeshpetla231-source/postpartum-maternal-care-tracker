import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 4000 },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const forumPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, maxlength: 10000 },
    tags: [{ type: String, enum: ['support', 'recovery', 'feeding', 'sleep', 'mood', 'new-parent'] }],
    isAnonymous: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    flags: [{ type: String }],
    comments: [commentSchema]
  },
  { timestamps: true }
);

forumPostSchema.index({ createdAt: -1 });

const ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;
