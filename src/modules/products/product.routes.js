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
*/
const uploadDir = "uploads/products"

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
    cb(new Error("Format foto harus JPG, PNG, atau WEBP"), false)
  }
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
| PRODUCT ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/products
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Ambil semua produk
 *     description: Owner melihat produk pada semua toko miliknya. Admin/kasir melihat produk pada toko yang sama.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data produk berhasil diambil
 */
router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllProducts
)

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Ambil detail produk
 *     description: Mengambil detail produk berdasarkan ID.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produk
 *     responses:
 *       200:
 *         description: Detail produk berhasil diambil
 *       404:
 *         description: Produk tidak ditemukan
 */
router.get(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getProductById
)

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Tambah produk
 *     description: Owner atau admin menambahkan produk. Produk bisa memakai diskon dengan mengisi id_discount, atau tanpa diskon dengan null.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kode_produk
 *               - nama_produk
 *             properties:
 *               id_store:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               id_category:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               id_discount:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               kode_produk:
 *                 type: string
 *                 example: PRD-0001
 *               barcode:
 *                 type: string
 *                 nullable: true
 *                 example: "8991234567890"
 *               nama_produk:
 *                 type: string
 *                 example: Aqua Botol 600ml
 *               deskripsi:
 *                 type: string
 *                 nullable: true
 *                 example: Air mineral botol ukuran 600ml
 *               harga_beli:
 *                 type: number
 *                 example: 3000
 *               harga_jual:
 *                 type: number
 *                 example: 5000
 *               stok:
 *                 type: integer
 *                 example: 50
 *               stok_minimum:
 *                 type: integer
 *                 example: 10
 *               satuan:
 *                 type: string
 *                 example: pcs
 *               foto:
 *                 type: string
 *                 nullable: true
 *                 example: /uploads/products/foto.png
 *               status_produk:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       201:
 *         description: Produk berhasil ditambahkan
 *       400:
 *         description: Gagal menambahkan produk
 */
router.post(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  createProduct
)

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update produk
 *     description: Owner atau admin memperbarui produk, termasuk memilih atau melepas diskon produk.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kode_produk
 *               - nama_produk
 *               - status_produk
 *             properties:
 *               id_store:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               id_category:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               id_discount:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               kode_produk:
 *                 type: string
 *                 example: PRD-0001
 *               barcode:
 *                 type: string
 *                 nullable: true
 *                 example: "8991234567890"
 *               nama_produk:
 *                 type: string
 *                 example: Aqua Botol 600ml Update
 *               deskripsi:
 *                 type: string
 *                 nullable: true
 *                 example: Air mineral botol ukuran 600ml
 *               harga_beli:
 *                 type: number
 *                 example: 3000
 *               harga_jual:
 *                 type: number
 *                 example: 5500
 *               stok:
 *                 type: integer
 *                 example: 40
 *               stok_minimum:
 *                 type: integer
 *                 example: 10
 *               satuan:
 *                 type: string
 *                 example: pcs
 *               foto:
 *                 type: string
 *                 nullable: true
 *                 example: /uploads/products/foto.png
 *               status_produk:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       200:
 *         description: Produk berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui produk
 */
router.put(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  updateProduct
)

/**
 * @swagger
 * /products/{id}/foto:
 *   put:
 *     summary: Update foto produk
 *     description: Owner atau admin memperbarui foto produk.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produk
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto produk berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui foto produk
 */
router.put(
  "/:id/foto",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  uploadFoto.single("foto"),
  updateProductFoto
)

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Hapus produk
 *     description: Owner atau admin menghapus produk berdasarkan ID.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produk
 *     responses:
 *       200:
 *         description: Produk berhasil dihapus
 *       400:
 *         description: Gagal menghapus produk
 */
router.delete(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  deleteProduct
)

module.exports = router