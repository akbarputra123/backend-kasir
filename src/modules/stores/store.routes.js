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
| Konfigurasi upload logo toko.
|--------------------------------------------------------------------------
*/
const uploadDir = "uploads/stores"

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Format logo harus JPG, PNG, atau WEBP"), false)
  }
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
 *     description: Owner dapat melihat semua data toko.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data toko berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
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
 *       401:
 *         description: Token tidak valid
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
 *       404:
 *         description: Toko tidak ditemukan
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
 *     description: Owner membuat toko baru. PPN bisa diaktifkan atau dimatikan pada toko.
 *     tags:
 *       - Stores
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
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
 *     responses:
 *       201:
 *         description: Toko berhasil ditambahkan
 *       400:
 *         description: Gagal menambahkan toko
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  createStore
)

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     summary: Update toko
 *     description: Owner memperbarui data toko, termasuk pengaturan PPN.
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
 *     responses:
 *       200:
 *         description: Toko berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui toko
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
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
 *     responses:
 *       200:
 *         description: Logo toko berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui logo toko
 */
router.put(
  "/:id/logo",
  authMiddleware,
  authorizeRoles("owner"),
  uploadLogo.single("logo"),
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
 *       400:
 *         description: Gagal menghapus toko
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  deleteStore
)

module.exports = router