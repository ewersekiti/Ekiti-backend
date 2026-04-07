import mongoose from 'mongoose'

const LocationSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    type:   { type: String, enum: ['lga', 'lcda'], required: true },
    active: { type: Boolean, default: true },
    order:  { type: Number, default: 0 },
  },
  { timestamps: true }
)

LocationSchema.index({ type: 1, name: 1 }, { unique: true })

export default mongoose.model('Location', LocationSchema)
