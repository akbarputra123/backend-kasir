
const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const {
  getAllStores,
  getMyStores,
  getStoreById,
  getMyStoreUsage,
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
| UPLOAD DIRECTORY
|--------------------------------------------------------------------------
*/
const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "stores"
)

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  })
}

/*
|--------------------------------------------------------------------------
| MULTER STORAGE
|--------------------------------------------------------------------------
*/
const storage = multer.diskStorage({
  destination: (
    req,
    file,
    callback
  ) => {
    callback(null, uploadDir)
  },

  filename: (
    req,
    file,
    callback
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase()

    const originalName = path
      .basename(
        file.originalname,
        extension
      )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "")

    const safeName =
      originalName || "logo"

    const uniqueName =
      `${Date.now()}-` +
      `${Math.round(Math.random() * 1e9)}-` +
      `${safeName}${extension}`

    callback(null, uniqueName)
  }
})

/*
|--------------------------------------------------------------------------
| FILE FILTER
|--------------------------------------------------------------------------
*/
const fileFilter = (
  req,
  file,
  callback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ]

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
  ]

  const extension = path
    .extname(file.originalname)
    .toLowerCase()

  const mimeAllowed =
    allowedMimeTypes.includes(
      file.mimetype
    )

  const extensionAllowed =
    allowedExtensions.includes(
      extension
    )

  if (
    !mimeAllowed ||
    !extensionAllowed
  ) {
    return callback(
      new Error(
        "Format logo harus JPG, JPEG, PNG, atau WEBP"
      ),
      false
    )
  }

  return callback(null, true)
}

/*
|--------------------------------------------------------------------------
| MULTER INSTANCE
|--------------------------------------------------------------------------
*/
const uploadLogo = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      2 * 1024 * 1024,

    files: 1
  }
})

/*
|--------------------------------------------------------------------------
| MULTER ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleUploadLogo = (
  req,
  res,
  next
) => {
  const upload =
    uploadLogo.single("logo")

  upload(req, res, (error) => {
    if (!error) {
      return next()
    }

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          sukses: false,
          pesan:
            "Ukuran logo maksimal 2MB",
          error:
            error.message
        })
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          sukses: false,
          pesan:
            "Field file harus menggunakan nama logo",
          error:
            error.message
        })
      }

      return res.status(400).json({
        sukses: false,
        pesan:
          "Gagal mengunggah logo",
        error:
          error.message
      })
    }

    return res.status(400).json({
      sukses: false,
      pesan:
        error.message ||
        "Gagal mengunggah logo",
      error:
        error.message || null
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
 *     summary: Ambil semua toko milik owner
 *     description: Mengambil semua toko milik owner yang sedang login. Owner lain tidak dapat melihat data toko tersebut.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data toko milik owner berhasil diambil
 *       401:
 *         description: Token tidak ditemukan atau tidak valid
 *       403:
 *         description: Hanya owner yang dapat mengakses endpoint ini
 */
router.get(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  getAllStores
)

/**
 * @swagger
 * /stores/my-stores:
 *   get:
 *     summary: Ambil toko sesuai user login
 *     description: Owner mendapatkan seluruh toko miliknya. Admin dan kasir hanya mendapatkan toko yang terhubung melalui users.id_store.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data toko user berhasil diambil
 *       401:
 *         description: Token tidak ditemukan atau tidak valid
 *       403:
 *         description: User belum terhubung dengan toko
 */
router.get(
  "/my-stores",
  authMiddleware,
  authorizeRoles(
    "owner",
    "admin",
    "kasir"
  ),
  getMyStores
)

/**
 * @swagger
 * /stores/usage:
 *   get:
 *     summary: Ambil penggunaan batas toko
 *     description: Mengambil jumlah toko, batas toko, dan sisa toko berdasarkan paket aktif milik owner.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Penggunaan batas toko berhasil diambil
 *       403:
 *         description: Bukan owner atau tidak memiliki langganan aktif
 */
router.get(
  "/usage",
  authMiddleware,
  authorizeRoles("owner"),
  getMyStoreUsage
)

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     summary: Ambil detail toko
 *     description: Owner hanya dapat melihat toko miliknya. Admin dan kasir hanya dapat melihat toko yang terhubung dengan akun mereka.
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
 *     responses:
 *       200:
 *         description: Detail toko berhasil diambil
 *       403:
 *         description: Tidak memiliki akses ke toko
 *       404:
 *         description: Toko tidak ditemukan
 */
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(
    "owner",
    "admin",
    "kasir"
  ),
  getStoreById
)

/**
 * @swagger
 * /stores:
 *   post:
 *     summary: Tambah toko baru
 *     description: Owner membuat toko baru sesuai batas paket langganan aktif. Kepemilikan toko otomatis menggunakan id_user owner dari JWT.
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
 *                 format: email
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 format: binary
 *               status_toko:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum:
 *                   - ya
 *                   - tidak
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 format: double
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
 *                 format: email
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 nullable: true
 *                 example: /uploads/stores/logo.png
 *               status_toko:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum:
 *                   - ya
 *                   - tidak
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 format: double
 *                 example: 11
 *     responses:
 *       201:
 *         description: Toko berhasil dibuat
 *       403:
 *         description: Bukan owner, tidak memiliki paket aktif, atau batas toko tercapai
 *       409:
 *         description: Nama toko sudah digunakan oleh owner
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
 *     summary: Perbarui toko
 *     description: Owner hanya dapat memperbarui toko miliknya sendiri.
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
 *                 format: email
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 format: binary
 *               status_toko:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum:
 *                   - ya
 *                   - tidak
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 format: double
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
 *                 format: email
 *                 nullable: true
 *                 example: toko@siopos.com
 *               logo:
 *                 type: string
 *                 nullable: true
 *                 example: /uploads/stores/logo.png
 *               status_toko:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *               ppn_aktif:
 *                 type: string
 *                 enum:
 *                   - ya
 *                   - tidak
 *                 example: ya
 *               ppn_persen:
 *                 type: number
 *                 format: double
 *                 example: 11
 *     responses:
 *       200:
 *         description: Toko berhasil diperbarui
 *       403:
 *         description: Bukan pemilik toko
 *       404:
 *         description: Toko tidak ditemukan
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
 *     summary: Perbarui logo toko
 *     description: Owner hanya dapat memperbarui logo toko miliknya.
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
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo toko berhasil diperbarui
 *       403:
 *         description: Bukan pemilik toko
 *       404:
 *         description: Toko tidak ditemukan
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
 *     description: Owner hanya dapat menghapus toko miliknya sendiri.
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
 *     responses:
 *       200:
 *         description: Toko berhasil dihapus
 *       403:
 *         description: Bukan pemilik toko
 *       404:
 *         description: Toko tidak ditemukan
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  deleteStore
)

module.exports = router
