import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'

// Cloudinary storage — images go to 'ekiti-ers/images', videos to 'ekiti-ers/videos'
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/')
    return {
      folder: isVideo ? 'ekiti-ers/videos' : 'ekiti-ers/images',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv'],
      // Use original filename (sanitised) as the public_id
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_').replace(/\.[^/.]+$/, '')}`,
    }
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|mov|avi|mkv)/
  if (allowed.test(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image and video files are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
    files: 10,
  },
})

// Use on incident create: up to 8 images + 2 videos
export const incidentUpload = upload.fields([
  { name: 'images', maxCount: 8 },
  { name: 'videos', maxCount: 2 },
])

// Use on partner/agency logo upload: single image field named 'logo'
export const logoUpload = upload.single('logo')
