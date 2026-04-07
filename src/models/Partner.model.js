import mongoose from 'mongoose'

const PartnerSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    logoUrl: { type: String, trim: true, default: '' },
    active:  { type: Boolean, default: true },
    order:   { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Partner', PartnerSchema)
