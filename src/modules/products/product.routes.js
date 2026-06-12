const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductFoto,
  deleteProduct
} = require("./product.controller")

const {
  authMiddleware,
  authorizeRoles
} = require("../../middlewares/authMiddleware")

const {
  subscriptionMiddleware
} = require("../../middlewares/subscriptionMiddleware")

const router = express.Router()

/*
|--------------------------------------------------------------------------
| UPLOAD CONFIG
|--------------------------------------------------------------------------
| Folder tujuan:
| uploads/products
|--------------------------------------------------------------------------
*/
const uploadDir = path.join(process.cwd(), "uploads", "products")

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

    const safeName = originalName || "product"

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}-${safeName}${ext}`

    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Format foto harus JPG, JPEG, PNG, atau WEBP"),
      false
    )
  }

  cb(null, true)
}

const uploadFoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
})

/*
|--------------------------------------------------------------------------
| MULTER ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleUploadFoto = (req, res, next) => {
  const upload = uploadFoto.single("foto")

  upload(req, res, (error) => {
    if (!error) {
      return next()
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          sukses: false,
          pesan: "Ukuran foto maksimal 2MB",
          error: error.message
        })
      }

      return res.status(400).json({
        sukses: false,
        pesan: "Gagal upload foto",
        error: error.message
      })
    }

    return res.status(400).json({
      sukses: false,
      pesan: error.message || "Gagal upload foto",
      error: error.message
    })
  })
}

/*
|--------------------------------------------------------------------------
| PRODUCT ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/products
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllProducts
)

router.get(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getProductById
)

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
| Bisa JSON biasa atau multipart/form-data.
| Field file: foto
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  handleUploadFoto,
  createProduct
)

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
| Bisa JSON biasa atau multipart/form-data.
| Field file: foto
|--------------------------------------------------------------------------
*/
router.put(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  handleUploadFoto,
  updateProduct
)

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT FOTO ONLY
|--------------------------------------------------------------------------
| Field file: foto
|--------------------------------------------------------------------------
*/
router.put(
  "/:id/foto",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  handleUploadFoto,
  updateProductFoto
)

router.delete(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  deleteProduct
)

module.exports = router