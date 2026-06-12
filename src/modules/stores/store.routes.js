const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const {
  getAllStores,
  getMyStores,
  getStoreById,
  createStore,
  updateStore,
  updateStoreLogo,
  deleteStore
} = require("./store.controller")

const {
  authMiddleware,
  authorizeRoles
} = require("../../middlewares/authMiddleware")

const router = express.Router()

/*
|--------------------------------------------------------------------------
| UPLOAD CONFIG
|--------------------------------------------------------------------------
| Folder tujuan:
| uploads/stores
|--------------------------------------------------------------------------
*/
const uploadDir = path.join(process.cwd(), "uploads", "stores")

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

    const safeName = originalName || "logo"

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
      new Error("Format logo harus JPG, JPEG, PNG, atau WEBP"),
      false
    )
  }

  cb(null, true)
}

const uploadLogo = multer({
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
const handleUploadLogo = (req, res, next) => {
  const upload = uploadLogo.single("logo")

  upload(req, res, (error) => {
    if (!error) {
      return next()
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          sukses: false,
          pesan: "Ukuran logo maksimal 2MB",
          error: error.message
        })
      }

      return res.status(400).json({
        sukses: false,
        pesan: "Gagal upload logo",
        error: error.message
      })
    }

    return res.status(400).json({
      sukses: false,
      pesan: error.message || "Gagal upload logo",
      error: error.message
    })
  })
}

/*
|--------------------------------------------------------------------------
| STORE ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/stores
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /stores:
 *   get:
 *     summary: Ambil semua data toko
 *     description: Owner, admin, dan kasir dapat melihat data toko sesuai akses sistem.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data toko berhasil diambil
 */
router.get(
  "/",
  authMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllStores
)

/**
 * @swagger
 * /stores/my-stores:
 *   get:
 *     summary: Ambil toko milik user login
 *     description: Mengambil data toko berdasarkan user yang sedang login.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data toko saya berhasil diambil
 */
router.get(
  "/my-stores",
  authMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getMyStores
)

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Ambil detail toko
 *     description: Mengambil detail toko berdasarkan ID.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getStoreById
)

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Tambah toko baru
 *     description: Owner membuat toko baru. Bisa upload logo dengan multipart/form-data.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama_toko
 *             properties:
 *               nama_toko:
 *                 type: string
 *                 example: Toko SIOPOS
 *               alamat:
 *                 type: string
 *                 nullable: true
 *                 example: Ternate
 *               no_hp:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 format: binary
 *               status_toko:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum: [ya, tidak]
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 example: 11
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_toko
 *             properties:
 *               nama_toko:
 *                 type: string
 *                 example: Toko SIOPOS
 *               alamat:
 *                 type: string
 *                 nullable: true
 *                 example: Ternate
 *               no_hp:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 nullable: true
 *                 example: /uploads/stores/logo.png
 *               status_toko:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum: [ya, tidak]
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 example: 11
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  handleUploadLogo,
  createStore
)

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update toko
 *     description: Owner memperbarui data toko. Bisa upload logo baru dengan multipart/form-data.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID toko
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama_toko
 *               - status_toko
 *             properties:
 *               nama_toko:
 *                 type: string
 *                 example: Toko SIOPOS Update
 *               alamat:
 *                 type: string
 *                 nullable: true
 *                 example: Ternate Selatan
 *               no_hp:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 format: binary
 *               status_toko:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum: [ya, tidak]
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 example: 11
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_toko
 *               - status_toko
 *             properties:
 *               nama_toko:
 *                 type: string
 *                 example: Toko SIOPOS Update
 *               alamat:
 *                 type: string
 *                 nullable: true
 *                 example: Ternate Selatan
 *               no_hp:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 nullable: true
 *                 example: /uploads/stores/logo.png
 *               status_toko:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum: [ya, tidak]
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 example: 11
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  handleUploadLogo,
  updateStore
)

/**
 * @swagger
 * /stores/{id}/logo:
 *   put:
 *     summary: Update logo toko
 *     description: Owner memperbarui logo toko menggunakan upload file.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID toko
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 */
router.put(
  "/:id/logo",
  authMiddleware,
  authorizeRoles("owner"),
  handleUploadLogo,
  updateStoreLogo
)

/**
 * @swagger
 * /stores/{id}:
 *   delete:
 *     summary: Hapus toko
 *     description: Owner menghapus toko berdasarkan ID.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  deleteStore
)

module.exports = router