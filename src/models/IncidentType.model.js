import mongoose from 'mongoose'

const IncidentTypeSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    slug:   { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon:   { type: String, trim: true, default: 'ellipsis-horizontal-circle' },
    active: { type: Boolean, default: true },
    order:  { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('IncidentType', IncidentTypeSchema)
