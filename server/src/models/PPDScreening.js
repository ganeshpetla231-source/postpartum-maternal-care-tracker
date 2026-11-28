import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    options: [
      {
        label: { type: String, required: true },
        score: { type: Number, min: 0, max: 3, required: true }
      }
    ]
  },
  { _id: false }
);

const questionnaireSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    disclaimer: { type: String, required: true },
    questions: [questionSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const screeningSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionnaire: { type: mongoose.Schema.Types.ObjectId, ref: 'Questionnaire', required: true },
    answers: [
      {
        questionId: { type: String, required: true },
        score: { type: Number, min: 0, max: 3, required: true }
      }
    ],
    totalScore: { type: Number, min: 0, max: 30, required: true },
    riskLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'], required: true },
    flaggedSelfHarm: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Questionnaire =
  mongoose.models.Questionnaire || mongoose.model('Questionnaire', questionnaireSchema);
const PPDScreening =
  mongoose.models.PPDScreening || mongoose.model('PPDScreening', screeningSchema);

export default PPDScreening;
