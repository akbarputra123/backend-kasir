const express = require("express")

const {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  deactivateDiscount
} = require("./discount.controller")

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
| DISCOUNT ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/discounts
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /discounts:
 *   get:
 *     summary: Ambil semua diskon
 *     description: Owner melihat diskon pada semua toko miliknya. Admin/kasir melihat diskon pada toko yang sama.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data diskon berhasil diambil
 */
router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllDiscounts
)

/**
 * @swagger
 * /discounts/{id}:
 *   get:
 *     summary: Ambil detail diskon
 *     description: Mengambil detail diskon berdasarkan ID.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID diskon
 *     responses:
 *       200:
 *         description: Detail diskon berhasil diambil
 */
router.get(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getDiscountById
)

/**
 * @swagger
 * /discounts:
 *   post:
 *     summary: Tambah diskon
 *     description: Owner/admin menambahkan diskon produk. Owner wajib kirim id_store, admin otomatis memakai id_store dari token.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_diskon
 *               - tipe_diskon
 *               - nilai_diskon
 *             properties:
 *               id_store:
 *                 type: integer
 *                 example: 1
 *               nama_diskon:
 *                 type: string
 *                 example: Diskon 10 Persen
 *               tipe_diskon:
 *                 type: string
 *                 enum: [nominal, persen]
 *                 example: persen
 *               nilai_diskon:
 *                 type: number
 *                 example: 10
 *               tanggal_mulai:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-01 00:00:00
 *               tanggal_berakhir:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-30 23:59:59
 *               status_diskon:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       201:
 *         description: Diskon berhasil ditambahkan
 */
router.post(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  createDiscount
)

/**
 * @swagger
 * /discounts/{id}:
 *   put:
 *     summary: Update diskon
 *     description: Owner/admin memperbarui data diskon.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID diskon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_diskon
 *               - tipe_diskon
 *               - nilai_diskon
 *               - status_diskon
 *             properties:
 *               id_store:
 *                 type: integer
 *                 example: 1
 *               nama_diskon:
 *                 type: string
 *                 example: Diskon 10 Persen Update
 *               tipe_diskon:
 *                 type: string
 *                 enum: [nominal, persen]
 *                 example: persen
 *               nilai_diskon:
 *                 type: number
 *                 example: 15
 *               tanggal_mulai:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-01 00:00:00
 *               tanggal_berakhir:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-30 23:59:59
 *               status_diskon:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       200:
 *         description: Diskon berhasil diperbarui
 */
router.put(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  updateDiscount
)

/**
 * @swagger
 * /discounts/{id}/deactivate:
 *   put:
 *     summary: Nonaktifkan diskon
 *     description: Owner/admin menonaktifkan diskon tanpa menghapus data.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID diskon
 *     responses:
 *       200:
 *         description: Diskon berhasil dinonaktifkan
 */
router.put(
  "/:id/deactivate",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  deactivateDiscount
)

/**
 * @swagger
 * /discounts/{id}:
 *   delete:
 *     summary: Hapus diskon
 *     description: Owner/admin menghapus diskon. Jika diskon dipakai produk, sistem melepas diskon dari produk terlebih dahulu.
 *     tags:
 *       - Discounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID diskon
 *     responses:
 *       200:
 *         description: Diskon berhasil dihapus
 */
router.delete(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  deleteDiscount
)

module.exports = router