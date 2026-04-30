import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { errorHandler } from './middlewares/error.middleware.js'
import { seedSystemRoles } from './controllers/role.controller.js'
import { warmRoleCache } from './utils/rolePermissionsCache.js'
import { seedConfigDefaults } from './controllers/config.controller.js'

import authRoutes from './routes/auth.routes.js'
import incidentRoutes from './routes/incident.routes.js'
import userRoutes from './routes/user.routes.js'
import roleRoutes from './routes/role.routes.js'
import reportRoutes from './routes/report.routes.js'
import alertRoutes from './routes/alert.routes.js'
import agencyRoutes from './routes/agency.routes.js'
import configRoutes from './routes/config.routes.js'

const app = express()

// Connect to MongoDB, then seed system roles and warm the permissions cache
connectDB().then(async () => {
  await seedSystemRoles()
  await warmRoleCache()
  await seedConfigDefaults()
})

// CORS — allow web dev server, Expo web, and any configured frontend URL
app.use(
  cors({
    origin: true, // <-- allows ALL origins automatically
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ✅ Handle preflight requests (VERY IMPORTANT)
app.options('*', cors())


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Ekiti State Emergency Response System API',
    status: 'running',
    version: '1.0.0',
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/agencies', agencyRoutes)
app.use('/api/config',   configRoutes)

// Global error handler — must be last
app.use(errorHandler)

export default app
