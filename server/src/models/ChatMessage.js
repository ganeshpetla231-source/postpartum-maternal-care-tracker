import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    escalation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escalation',
      required: true,
      index: true
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['mother', 'doctor'], required: true },
    text: { type: String, required: true, maxlength: 4000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const ChatMessage =
  mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
