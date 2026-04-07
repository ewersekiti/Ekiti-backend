import mongoose from 'mongoose'

const AgencySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    code:        { type: String, trim: true, uppercase: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['security', 'medical', 'fire', 'transport', 'government', 'other'],
      default: 'other',
    },
    logoUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
)

export default mongoose.model('Agency', AgencySchema)
