import { Router, Request, Response } from 'express'
import multer from 'multer'
import { uploadImageToGitHub } from '../services/githubService.js'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'))
    }
  }
})

// Upload image endpoint
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' })
    }

    const result = await uploadImageToGitHub(req.file.buffer, req.file.originalname, req.file.mimetype)

    if (result.success) {
      res.json({ success: true, data: { url: result.url } })
    } else {
      res.status(500).json({ success: false, error: result.error })
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    })
  }
})

export default router
