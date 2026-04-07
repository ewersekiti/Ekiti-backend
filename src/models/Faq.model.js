import mongoose from 'mongoose'

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer:   { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'General' },
    order:    { type: Number, default: 0 },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Faq', FaqSchema)
