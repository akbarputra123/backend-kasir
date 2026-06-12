const multer = require("multer")
const path = require("path")
const fs = require("fs")

const uploadDir = path.join(__dirname, "../../uploads/stores")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()

    const originalName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "")

    const uniqueName = `${Date.now()}_${originalName}${ext}`

    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ]

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Logo hanya boleh JPG, JPEG, PNG, atau WEBP"),
      false
    )
  }

  cb(null, true)
}

const uploadStoreLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
})

module.exports = uploadStoreLogo