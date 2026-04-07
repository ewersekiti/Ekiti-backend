import mongoose from 'mongoose'
import Incident from '../models/Incident.model.js'
import User from '../models/User.model.js'
import { generateIncidentId } from '../utils/generateIncidentId.js'
import { getRolePermissions } from '../utils/rolePermissionsCache.js'

// Map mobile app 'severity' values → backend 'priority' values
const SEVERITY_TO_PRIORITY = {
  emergency: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

// Build a find filter from either a MongoDB ObjectId string or an INC-xxx incidentId
const buildIdFilter = (id) =>
  mongoose.isValidObjectId(id) ? { _id: id } : { incidentId: id }

// POST /api/incidents  (public + SMS intake)
export const createIncident = async (req, res) => {
  const body = req.body
  const channel = body.channel || 'web'

  // Staff-logged channels require authentication and the create_sms_incident permission
  const STAFF_CHANNELS = ['sms', 'call', 'whatsapp', 'email', 'facebook', 'twitter', 'walk_in', 'other']
  if (STAFF_CHANNELS.includes(channel)) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required for SMS intake' })
    }
    const perms = await getRolePermissions(req.user.role)
    if (!perms.includes('create_sms_incident')) {
      return res.status(403).json({ message: "Forbidden: 'create_sms_incident' permission required" })
    }
  }

  // Public channels (web portal / mobile app) always get 'medium' priority;
  // severity is determined by admin at assignment time, not by the public reporter.
  const PUBLIC_CHANNELS = ['web', 'app']
  const priority = PUBLIC_CHANNELS.includes(channel)
    ? 'medium'
    : (body.priority || SEVERITY_TO_PRIORITY[body.severity] || 'medium')

  // Build media array from multer uploads (if any)
  const media = []
  if (req.files) {
    const images = req.files.images || []
    const videos = req.files.videos || []

    images.forEach((f) =>
      media.push({
        type: 'image',
        filename: f.originalname,
        url: f.path, // Cloudinary secure URL
        caption: '',
      })
    )
    videos.forEach((f) =>
      media.push({
        type: 'video',
        filename: f.originalname,
        url: f.path, // Cloudinary secure URL
        caption: '',
      })
    )
  }

  const reporterName = body.anonymous === 'true' || body.anonymous === true
    ? 'Anonymous'
    : (body.reporter || body.name || 'Unknown')

  const incidentId = await generateIncidentId()

  const channelLabel = {
    sms:      'SMS',
    call:     'phone call',
    whatsapp: 'WhatsApp',
    email:    'email',
    facebook: 'Facebook',
    twitter:  'Twitter/X',
    walk_in:  'walk-in',
    other:    'other channel',
    web:      'web portal',
    app:      'mobile app',
    phone:    'phone call',
  }[channel] || channel

  const incident = await Incident.create({
    incidentId,
    title: body.title,
    description: body.description,
    type: body.type || 'other',
    location: body.location,
    lga: body.lga,
    lcda: body.lcda,
    latitude: body.latitude,
    longitude: body.longitude,
    status: 'pending',
    priority,
    channel,
    reporter: reporterName,
    anonymous: body.anonymous === 'true' || body.anonymous === true,
    reporterPhone: body.reporterPhone || body.phone,
    reporterEmail: body.reporterEmail || body.email,
    isOngoing: body.isOngoing === 'true' || body.isOngoing === true,
    peopleInvolved: body.peopleInvolved,
    killed: body.killed || '0',
    injured: body.injured || '0',
    displaced: body.displaced || '0',
    injuryDetails: body.injuryDetails,
    authorityContacted: body.authorityContacted,
    agency: body.agency,
    media,
    imageCount: media.filter((m) => m.type === 'image').length || Number(body.imageCount) || 0,
    videoCount: media.filter((m) => m.type === 'video').length || Number(body.videoCount) || 0,
    timeline: [
      {
        action:    `Incident reported via ${channelLabel}`,
        status:    'pending',
        note:      'Incident submitted and awaiting review',
        time:      new Date(),
        timestamp: new Date(),
        by:        req.user ? req.user.name : (reporterName || 'System'),
      },
    ],
  })

  res.status(201).json({ message: 'Incident created successfully', incident })
}

// GET /api/incidents
export const getIncidents = async (req, res) => {
  const { status, priority, channel, lga, search, assignedTo, page = 1, limit = 20 } = req.query

  const filter = {}

  const perms = await getRolePermissions(req.user.role)

  // If the user cannot view all incidents, restrict to only their assigned ones
  if (!perms.includes('view_incidents')) {
    filter.assignedTo = req.user._id
  }

  // ?assignedTo=me — used by the My Incidents page for any role
  if (assignedTo === 'me') {
    filter.assignedTo = req.user._id
  }

  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (channel) filter.channel = channel
  if (lga) filter.lga = new RegExp(lga, 'i')

  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { location: new RegExp(search, 'i') },
      { incidentId: new RegExp(search, 'i') },
    ]
  }

  const skip = (Number(page) - 1) * Number(limit)
  const total = await Incident.countDocuments(filter)

  const incidents = await Incident.find(filter)
    .populate('assignedTo', 'name agency email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  res.status(200).json({
    incidents,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  })
}

// GET /api/incidents/:id
export const getIncident = async (req, res) => {
  const incident = await Incident.findOne(buildIdFilter(req.params.id))
    .populate('assignedTo', 'name agency email role')

  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' })
  }

  // Users without view_incidents can only access incidents assigned to them
  const perms = await getRolePermissions(req.user.role)
  if (
    !perms.includes('view_incidents') &&
    incident.assignedTo?._id?.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: 'Access denied to this incident' })
  }

  res.status(200).json({ incident })
}

// PATCH /api/incidents/:id/assign
export const assignIncident = async (req, res) => {
  const { userId, agency, priority } = req.body

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' })
  }

  const assignee = await User.findById(userId)
  if (!assignee) {
    return res.status(404).json({ message: 'User not found' })
  }
  if (assignee.status === 'inactive') {
    return res.status(400).json({ message: 'Cannot assign to an inactive user' })
  }

  const incident = await Incident.findOne(buildIdFilter(req.params.id))
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' })
  }

  incident.assignedTo = assignee._id
  if (agency) incident.agency = agency
  if (incident.status === 'pending') incident.status = 'in_progress'
  const validPriorities = ['low', 'medium', 'high', 'critical']
  if (priority && validPriorities.includes(priority)) incident.priority = priority

  incident.timeline.push({
    action: `Assigned to ${assignee.name}`,
    note: priority ? `Priority set to ${priority}` : undefined,
    time: new Date(),
    by: req.user.name,
  })

  await incident.save()
  await incident.populate('assignedTo', 'name agency email role')

  res.status(200).json({ message: 'Incident assigned successfully', incident })
}

// PATCH /api/incidents/:id/status
export const updateStatus = async (req, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'in_progress', 'resolved']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `status must be one of: ${validStatuses.join(', ')}`,
    })
  }

  const incident = await Incident.findOne(buildIdFilter(req.params.id))
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' })
  }

  const prevStatus = incident.status
  incident.status = status

  if (status === 'resolved' && req.body.resolutionReport?.trim()) {
    incident.resolutionReport = req.body.resolutionReport.trim()
  }

  const statusLabels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' }
  incident.timeline.push({
    action:    `Status changed from ${statusLabels[prevStatus]} to ${statusLabels[status]}`,
    status,
    note:      req.body.note || '',
    time:      new Date(),
    timestamp: new Date(),
    by:        req.user.name,
  })

  if (status === 'resolved') {
    incident.timeline.push({
      action:    'Incident resolved and closed',
      status:    'resolved',
      note:      incident.resolutionReport ? 'Resolution report submitted' : 'Case closed',
      time:      new Date(),
      timestamp: new Date(),
      by:        req.user.name,
    })
  }

  await incident.save()
  await incident.populate('assignedTo', 'name agency email role')

  res.status(200).json({ message: 'Status updated', incident })
}

// DELETE /api/incidents/:id
export const deleteIncident = async (req, res) => {
  const incident = await Incident.findOneAndDelete(buildIdFilter(req.params.id))
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' })
  }
  res.status(200).json({ message: 'Incident deleted successfully' })
}

// POST /api/incidents/:id/timeline
export const addTimeline = async (req, res) => {
  const { action } = req.body
  if (!action?.trim()) {
    return res.status(400).json({ message: 'action is required' })
  }

  const incident = await Incident.findOne(buildIdFilter(req.params.id))
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' })
  }

  incident.timeline.push({
    action: action.trim(),
    time: new Date(),
    by: req.user.name,
  })

  await incident.save()
  res.status(200).json({ message: 'Timeline entry added', incident })
}

// Strips an incident down to public-safe fields (no reporter PII, no internal assignee)
const toPublicView = (incident) => ({
  incidentId: incident.incidentId,
  title: incident.title,
  type: incident.type,
  description: incident.description,
  location: incident.location,
  lga: incident.lga,
  lcda: incident.lcda,
  status: incident.status,
  priority: incident.priority,
  channel: incident.channel,
  isOngoing: incident.isOngoing,
  killed: incident.killed,
  injured: incident.injured,
  displaced: incident.displaced,
  agency: incident.agency || null,
  // Timeline entries — strip the 'by' field to avoid leaking staff names to public
  timeline: incident.timeline.map((t) => ({
    action: t.action,
    time: t.time,
  })),
  createdAt: incident.createdAt,
  updatedAt: incident.updatedAt,
})

// GET /api/incidents/public  — all submitted incidents, public-safe fields only
// Supports: ?status=pending|in_progress|resolved  ?lga=Ado-Ekiti  ?type=flood  ?page=1  ?limit=20
export const getPublicIncidents = async (req, res) => {
  const { status, lga, type, page = 1, limit = 20 } = req.query

  const filter = {}
  if (status) filter.status = status
  if (lga) filter.lga = new RegExp(lga, 'i')
  if (type) filter.type = type

  const skip = (Number(page) - 1) * Number(limit)
  const total = await Incident.countDocuments(filter)

  const incidents = await Incident.find(filter)
    .select('incidentId title type description location lga lcda status priority channel isOngoing killed injured displaced agency timeline createdAt updatedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))

  res.status(200).json({
    incidents: incidents.map(toPublicView),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  })
}

// GET /api/incidents/track/:incidentId  — public, look up a single report by its ID
export const trackIncident = async (req, res) => {
  const incident = await Incident.findOne({ incidentId: req.params.incidentId })

  if (!incident) {
    return res.status(404).json({ message: 'Report not found. Check the ID and try again.' })
  }

  res.status(200).json({ incident: toPublicView(incident) })
}
