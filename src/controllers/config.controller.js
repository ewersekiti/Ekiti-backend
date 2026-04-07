import Faq from '../models/Faq.model.js'
import IncidentType from '../models/IncidentType.model.js'
import Location from '../models/Location.model.js'
import Partner from '../models/Partner.model.js'

// ─── Seed defaults (called once on startup if collections are empty) ──────────

const DEFAULT_FAQS = [
  { question: 'What is the Early Warning and Early Response System?', answer: 'The Ekiti State Early Warning and Early Response System (EWERS EKITI) is a government initiative to prevent and minimize violence and unrest in Ekiti State. It provides a grassroots-based intelligence gathering system to assist security agencies in preventing and responding effectively to incidents. Timely reports of unusual gatherings, unrest, conflicts and disturbances will help security agencies respond quickly.', category: 'General', order: 0 },
  { question: 'How can I be part of the Early Warning System?', answer: 'Residents of Ekiti State can help security agencies save lives, prevent and manage conflicts by providing timely and accurate intelligence through any of our reporting channels.', category: 'Participation', order: 1 },
  { question: 'How do I report an incident?', answer: 'You can report an incident via our website by clicking \'Report Incident\', via our mobile app (available on Android and iPhone), by calling 08062547143 to speak with a call center agent, or via SMS to 08168007000.', category: 'Reporting', order: 2 },
  { question: 'What types of incidents can I report?', answer: 'Armed Attacks, Banditry, Boundary Disputes, Cattle Rustling, Chieftaincy Tussles, Community Aggression, Criminal Activity, Cross-border Conflicts, Destruction of Property, Gender-based Violence, Inter-ethnic Disputes, Land Disputes, Political Conflicts, Protests, Terrorism, and more.', category: 'Reporting', order: 3 },
  { question: 'How do I use the SMS channel to report?', answer: 'Send an SMS to 08168007000 using the format: EKITI [your name], [location], [incident description].\n\nExample: EKITI Michael, Emure, There is an ongoing protest here.', category: 'SMS', order: 4 },
  { question: 'How fast do security agencies respond?', answer: 'The typical response time is between 5–30 minutes. When we receive an incident alert at the control room, instant alerts are sent to responders who move immediately. Our security agencies are always on alert to respond to any crime promptly.', category: 'Response', order: 5 },
  { question: 'Where is EWERS EKITI located?', answer: 'EWERS EKITI is located in a secured but undisclosed location to ensure the safety and integrity of the response operation.', category: 'General', order: 6 },
]

const DEFAULT_INCIDENT_TYPES = [
  { name: 'Flood',    slug: 'flood',    icon: 'water',                      order: 0 },
  { name: 'Fire',     slug: 'fire',     icon: 'flame',                      order: 1 },
  { name: 'Accident', slug: 'accident', icon: 'car',                        order: 2 },
  { name: 'Security', slug: 'security', icon: 'shield',                     order: 3 },
  { name: 'Medical',  slug: 'medical',  icon: 'medkit',                     order: 4 },
  { name: 'Theft',    slug: 'theft',    icon: 'bag-remove',                 order: 5 },
  { name: 'Assault',  slug: 'assault',  icon: 'warning',                    order: 6 },
  { name: 'Fraud',    slug: 'fraud',    icon: 'card',                       order: 7 },
  { name: 'Other',    slug: 'other',    icon: 'ellipsis-horizontal-circle', order: 8 },
]

const DEFAULT_LGAS = [
  'Ado-Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West',
  'Emure', 'Gbonyin', 'Ido/Osi', 'Ijero', 'Ikere', 'Ikole',
  'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye',
]

const DEFAULT_LCDAS = [
  'Ado Central LCDA', 'Ado North LCDA', 'Ado West LCDA', 'Ajoni LCDA',
  'Araromi LCDA', 'Ekameta LCDA', 'Ekiti Southeast LCDA', 'Ero LCDA',
  'Gbonyin LCDA', 'Ifedara LCDA', 'Ifeloju LCDA', 'Ifesowapo LCDA',
  'Igbara Odo/Ogotun LCDA', 'Ikere West LCDA', 'Ikole West LCDA',
  'Irede LCDA', 'Irewolede LCDA', 'Isokan LCDA', 'Okemesi/Ido-Ile LCDA',
]

export async function seedConfigDefaults() {
  const [faqCount, typeCount, lgaCount] = await Promise.all([
    Faq.countDocuments(),
    IncidentType.countDocuments(),
    Location.countDocuments({ type: 'lga' }),
  ])

  if (faqCount === 0) {
    await Faq.insertMany(DEFAULT_FAQS)
    console.log('✔ Seeded default FAQs')
  }

  if (typeCount === 0) {
    await IncidentType.insertMany(DEFAULT_INCIDENT_TYPES)
    console.log('✔ Seeded default incident types')
  }

  if (lgaCount === 0) {
    await Location.insertMany([
      ...DEFAULT_LGAS.map((name, i) => ({ name, type: 'lga', order: i })),
      ...DEFAULT_LCDAS.map((name, i) => ({ name, type: 'lcda', order: i })),
    ])
    console.log('✔ Seeded default LGAs and LCDAs')
  }
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const getFaqs = async (req, res) => {
  const filter = {}
  if (req.query.active === 'true')  filter.active = true
  if (req.query.active === 'false') filter.active = false
  const faqs = await Faq.find(filter).sort({ order: 1, createdAt: 1 })
  res.json({ faqs })
}

export const createFaq = async (req, res, next) => {
  try {
    const { question, answer, category, order } = req.body
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ message: 'Question and answer are required' })
    }
    const faq = await Faq.create({ question: question.trim(), answer: answer.trim(), category: category?.trim() || 'General', order: order ?? 0 })
    res.status(201).json({ message: 'FAQ created', faq })
  } catch (err) { next(err) }
}

export const updateFaq = async (req, res, next) => {
  try {
    const { question, answer, category, order, active } = req.body
    const faq = await Faq.findById(req.params.id)
    if (!faq) return res.status(404).json({ message: 'FAQ not found' })
    if (question !== undefined) faq.question = question.trim()
    if (answer   !== undefined) faq.answer   = answer.trim()
    if (category !== undefined) faq.category = category.trim()
    if (order    !== undefined) faq.order    = order
    if (active   !== undefined) faq.active   = active
    await faq.save()
    res.json({ message: 'FAQ updated', faq })
  } catch (err) { next(err) }
}

export const deleteFaq = async (req, res, next) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id)
    if (!faq) return res.status(404).json({ message: 'FAQ not found' })
    res.json({ message: 'FAQ deleted' })
  } catch (err) { next(err) }
}

// ─── Incident Types ───────────────────────────────────────────────────────────

export const getIncidentTypes = async (req, res) => {
  const filter = {}
  if (req.query.active === 'true')  filter.active = true
  if (req.query.active === 'false') filter.active = false
  const types = await IncidentType.find(filter).sort({ order: 1, name: 1 })
  res.json({ types })
}

export const createIncidentType = async (req, res, next) => {
  try {
    const { name, icon, order } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
    const slug = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const exists = await IncidentType.findOne({ slug })
    if (exists) return res.status(400).json({ message: 'An incident type with this name already exists' })
    const type = await IncidentType.create({ name: name.trim(), slug, icon: icon?.trim() || 'ellipsis-horizontal-circle', order: order ?? 0 })
    res.status(201).json({ message: 'Incident type created', type })
  } catch (err) { next(err) }
}

export const updateIncidentType = async (req, res, next) => {
  try {
    const { name, icon, order, active } = req.body
    const type = await IncidentType.findById(req.params.id)
    if (!type) return res.status(404).json({ message: 'Incident type not found' })
    if (name   !== undefined) { type.name = name.trim(); type.slug = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }
    if (icon   !== undefined) type.icon   = icon.trim()
    if (order  !== undefined) type.order  = order
    if (active !== undefined) type.active = active
    await type.save()
    res.json({ message: 'Incident type updated', type })
  } catch (err) { next(err) }
}

export const deleteIncidentType = async (req, res, next) => {
  try {
    const type = await IncidentType.findByIdAndDelete(req.params.id)
    if (!type) return res.status(404).json({ message: 'Incident type not found' })
    res.json({ message: 'Incident type deleted' })
  } catch (err) { next(err) }
}

// ─── Locations (LGA / LCDA) ───────────────────────────────────────────────────

export const getLocations = async (req, res) => {
  const filter = {}
  if (req.query.type)   filter.type   = req.query.type
  if (req.query.active === 'true')  filter.active = true
  if (req.query.active === 'false') filter.active = false
  const locations = await Location.find(filter).sort({ order: 1, name: 1 })
  res.json({ locations })
}

export const createLocation = async (req, res, next) => {
  try {
    const { name, type, order } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
    if (!['lga', 'lcda'].includes(type)) return res.status(400).json({ message: 'Type must be lga or lcda' })
    const exists = await Location.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' }, type })
    if (exists) return res.status(400).json({ message: `A ${type.toUpperCase()} with this name already exists` })
    const loc = await Location.create({ name: name.trim(), type, order: order ?? 0 })
    res.status(201).json({ message: 'Location created', location: loc })
  } catch (err) { next(err) }
}

export const updateLocation = async (req, res, next) => {
  try {
    const { name, order, active } = req.body
    const loc = await Location.findById(req.params.id)
    if (!loc) return res.status(404).json({ message: 'Location not found' })
    if (name   !== undefined) loc.name   = name.trim()
    if (order  !== undefined) loc.order  = order
    if (active !== undefined) loc.active = active
    await loc.save()
    res.json({ message: 'Location updated', location: loc })
  } catch (err) { next(err) }
}

export const deleteLocation = async (req, res, next) => {
  try {
    const loc = await Location.findByIdAndDelete(req.params.id)
    if (!loc) return res.status(404).json({ message: 'Location not found' })
    res.json({ message: 'Location deleted' })
  } catch (err) { next(err) }
}

// ─── Partners (Collaborating Agencies) ───────────────────────────────────────

export const getPartners = async (req, res) => {
  const filter = {}
  if (req.query.active === 'true')  filter.active = true
  if (req.query.active === 'false') filter.active = false
  const partners = await Partner.find(filter).sort({ order: 1, name: 1 })
  res.json({ partners })
}

export const createPartner = async (req, res, next) => {
  try {
    const { name, order } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Agency name is required' })
    const logoUrl = req.file?.path || ''
    const partner = await Partner.create({ name: name.trim(), logoUrl, order: order ?? 0 })
    res.status(201).json({ message: 'Partner created', partner })
  } catch (err) { next(err) }
}

export const updatePartner = async (req, res, next) => {
  try {
    const { name, order, active } = req.body
    const partner = await Partner.findById(req.params.id)
    if (!partner) return res.status(404).json({ message: 'Partner not found' })
    if (name   !== undefined) partner.name   = name.trim()
    if (order  !== undefined) partner.order  = order
    if (active !== undefined) partner.active = active
    if (req.file?.path)       partner.logoUrl = req.file.path
    await partner.save()
    res.json({ message: 'Partner updated', partner })
  } catch (err) { next(err) }
}

export const deletePartner = async (req, res, next) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id)
    if (!partner) return res.status(404).json({ message: 'Partner not found' })
    res.json({ message: 'Partner deleted' })
  } catch (err) { next(err) }
}
