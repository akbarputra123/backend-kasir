const express = require("express")

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require("./category.controller")

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
| CATEGORY ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/categories
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Ambil semua kategori
 *     description: Owner melihat kategori pada semua toko miliknya. Admin/kasir melihat kategori pada toko yang sama.
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data kategori berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 */
router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllCategories
)

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Ambil detail kategori
 *     description: Mengambil detail kategori berdasarkan ID.
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori
 *     responses:
 *       200:
 *         description: Detail kategori berhasil diambil
 *       404:
 *         description: Kategori tidak ditemukan
 */
router.get(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getCategoryById
)

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Tambah kategori
 *     description: Owner atau admin menambahkan kategori produk. Owner wajib mengirim id_store, admin otomatis memakai id_store dari token.
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_kategori
 *             properties:
 *               id_store:
 *                 type: integer
 *                 example: 1
 *               nama_kategori:
 *                 type: string
 *                 example: Minuman
 *               deskripsi:
 *                 type: string
 *                 example: Kategori produk minuman
 *               status_kategori:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       201:
 *         description: Kategori berhasil ditambahkan
 *       400:
 *         description: Gagal menambahkan kategori
 */
router.post(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  createCategory
)

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update kategori
 *     description: Owner atau admin memperbarui kategori. Owner wajib mengirim id_store, admin otomatis memakai id_store dari token.
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_kategori
 *               - status_kategori
 *             properties:
 *               id_store:
 *                 type: integer
 *                 example: 1
 *               nama_kategori:
 *                 type: string
 *                 example: Minuman Update
 *               deskripsi:
 *                 type: string
 *                 example: Kategori produk minuman update
 *               status_kategori:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       200:
 *         description: Kategori berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui kategori
 */
router.put(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  updateCategory
)

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Hapus kategori
 *     description: Owner atau admin menghapus kategori jika kategori belum digunakan produk.
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori
 *     responses:
 *       200:
 *         description: Kategori berhasil dihapus
 *       400:
 *         description: Gagal menghapus kategori
 */
router.delete(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  deleteCategory
)

module.exports = router