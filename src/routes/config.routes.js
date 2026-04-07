import { Router } from 'express'
import { protect, requirePermission } from '../middlewares/auth.middleware.js'
import { logoUpload } from '../middlewares/upload.middleware.js'
import {
  getFaqs, createFaq, updateFaq, deleteFaq,
  getIncidentTypes, createIncidentType, updateIncidentType, deleteIncidentType,
  getLocations, createLocation, updateLocation, deleteLocation,
  getPartners, createPartner, updatePartner, deletePartner,
} from '../controllers/config.controller.js'

const router = Router()
const guard  = [protect, requirePermission('manage_config')]

// ── FAQs (public GET) ──────────────────────────────────────────────────────
router.get('/faqs',            getFaqs)
router.post('/faqs',           ...guard, createFaq)
router.patch('/faqs/:id',      ...guard, updateFaq)
router.delete('/faqs/:id',     ...guard, deleteFaq)

// ── Incident Types (public GET) ────────────────────────────────────────────
router.get('/incident-types',           getIncidentTypes)
router.post('/incident-types',          ...guard, createIncidentType)
router.patch('/incident-types/:id',     ...guard, updateIncidentType)
router.delete('/incident-types/:id',    ...guard, deleteIncidentType)

// ── Locations — LGA & LCDA (public GET) ───────────────────────────────────
router.get('/locations',            getLocations)
router.post('/locations',           ...guard, createLocation)
router.patch('/locations/:id',      ...guard, updateLocation)
router.delete('/locations/:id',     ...guard, deleteLocation)

// ── Partners — Collaborating Agencies (public GET) ─────────────────────────
router.get('/partners',             getPartners)
router.post('/partners',            ...guard, logoUpload, createPartner)
router.patch('/partners/:id',       ...guard, logoUpload, updatePartner)
router.delete('/partners/:id',      ...guard, deletePartner)

export default router
