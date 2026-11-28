import mongoose from 'mongoose';

const lactationBookingSchema = new mongoose.Schema(
  {
    mother: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LactationConsultant',
      required: true,
      index: true
    },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    mode: { type: String, enum: ['video', 'in-person'], required: true },
    reason: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['booked', 'cancelled', 'completed'], default: 'booked' }
  },
  { timestamps: true }
);

lactationBookingSchema.index(
  { consultant: 1, slotStart: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);

const LactationBooking =
  mongoose.models.LactationBooking ||
  mongoose.model('LactationBooking', lactationBookingSchema);

export default LactationBooking;
