import mongoose from 'mongoose'

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    caption: { type: String, default: '' },
    filename: { type: String },
    url: { type: String },
    duration: { type: String }, // e.g. "0:52" for videos
  },
  { _id: false }
)

const TimelineSchema = new mongoose.Schema(
  {
    action:    { type: String, required: true },
    status:    { type: String, enum: ['pending', 'in_progress', 'resolved', null], default: null },
    note:      { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    time:      { type: Date, default: Date.now },
    by:        { type: String, default: 'System' },
  },
  { _id: false }
)

const IncidentSchema = new mongoose.Schema(
  {
    incidentId: { type: String, unique: true },

    // Core info
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, trim: true, default: 'other' },

    // Location
    location: { type: String, trim: true },
    lga: { type: String, trim: true },
    lcda: { type: String, trim: true },
    latitude: { type: String },
    longitude: { type: String },

    // Classification
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    channel: {
      type: String,
      enum: ['sms', 'call', 'whatsapp', 'email', 'facebook', 'twitter', 'walk_in', 'other', 'web', 'app', 'phone'],
      default: 'web',
    },

    // Reporter info
    reporter: { type: String, trim: true },
    anonymous: { type: Boolean, default: false },
    reporterPhone: { type: String, trim: true },
    reporterEmail: { type: String, trim: true, lowercase: true },

    // Casualty details (from mobile app)
    isOngoing: { type: Boolean, default: false },
    peopleInvolved: { type: String },
    killed: { type: String, default: '0' },
    injured: { type: String, default: '0' },
    displaced: { type: String, default: '0' },
    injuryDetails: { type: String },
    authorityContacted: { type: String },

    // Assignment
    agency: { type: String, trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Attached evidence
    media: [MediaSchema],

    // Activity log
    timeline: [TimelineSchema],

    // Resolution
    resolutionReport: { type: String, trim: true, default: '' },

    // Raw counts from app before actual upload
    imageCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Text search index
IncidentSchema.index({ title: 'text', description: 'text', location: 'text' })
// Fast lookups by status, priority, channel
IncidentSchema.index({ status: 1 })
IncidentSchema.index({ priority: 1 })
IncidentSchema.index({ assignedTo: 1 })

export default mongoose.model('Incident', IncidentSchema)
