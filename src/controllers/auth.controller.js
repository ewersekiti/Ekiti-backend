import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import { getRolePermissions } from '../utils/rolePermissionsCache.js'

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  // Include password field (it's normally excluded via select:false)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ message: 'Your account has been deactivated. Contact your administrator.' })
  }

  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = signToken(user._id, user.role)
  const permissions = await getRolePermissions(user.role)

  res.status(200).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: user.roleLabel,
      agency: user.agency,
      status: user.status,
    },
    permissions,
  })
}







export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' })
  }

  const user = await User.findById(req.user._id).select('+password')
  const isMatch = await user.matchPassword(currentPassword)
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' })
  }

  user.password = newPassword
  await user.save()

  res.status(200).json({ message: 'Password changed successfully' })
}

// GET /api/auth/me
export const getMe = async (req, res) => {
  const permissions = await getRolePermissions(req.user.role)
  res.status(200).json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      roleLabel: req.user.roleLabel,
      agency: req.user.agency,
      status: req.user.status,
    },
    permissions,
  })
}
