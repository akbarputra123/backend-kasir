const express = require("express")

const {
  getAllStockLogs,
  getStockLogsByProduct,
  stockIn,
  stockOut,
  stockAdjustment
} = require("./stockLog.controller")

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
| STOCK LOG ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/stock-logs
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /stock-logs:
 *   get:
 *     summary: Ambil semua riwayat stok
 *     description: Owner melihat semua riwayat stok toko miliknya. Admin/kasir melihat riwayat stok toko sendiri.
 *     tags:
 *       - Stock Logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Riwayat stok berhasil diambil
 */
router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllStockLogs
)

/**
 * @swagger
 * /stock-logs/product/{id_product}:
 *   get:
 *     summary: Ambil riwayat stok berdasarkan produk
 *     description: Mengambil riwayat stok untuk produk tertentu.
 *     tags:
 *       - Stock Logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_product
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID produk
 *     responses:
 *       200:
 *         description: Riwayat stok produk berhasil diambil
 */
router.get(
  "/product/:id_product",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getStockLogsByProduct
)

/**
 * @swagger
 * /stock-logs/stock-in:
 *   post:
 *     summary: Tambah stok masuk
 *     description: Owner/admin menambahkan stok produk.
 *     tags:
 *       - Stock Logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_product
 *               - jumlah
 *             properties:
 *               id_product:
 *                 type: integer
 *                 example: 1
 *               jumlah:
 *                 type: integer
 *                 example: 20
 *               keterangan:
 *                 type: string
 *                 example: Restock dari supplier
 *     responses:
 *       201:
 *         description: Stok masuk berhasil disimpan
 */
router.post(
  "/stock-in",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  stockIn
)

/**
 * @swagger
 * /stock-logs/stock-out:
 *   post:
 *     summary: Kurangi stok manual
 *     description: Owner/admin mengurangi stok produk secara manual, misalnya barang rusak atau hilang.
 *     tags:
 *       - Stock Logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_product
 *               - jumlah
 *             properties:
 *               id_product:
 *                 type: integer
 *                 example: 1
 *               jumlah:
 *                 type: integer
 *                 example: 5
 *               keterangan:
 *                 type: string
 *                 example: Barang rusak
 *     responses:
 *       201:
 *         description: Stok keluar berhasil disimpan
 */
router.post(
  "/stock-out",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  stockOut
)

/**
 * @swagger
 * /stock-logs/adjustment:
 *   post:
 *     summary: Penyesuaian stok
 *     description: Owner/admin mengubah stok produk ke jumlah final tertentu.
 *     tags:
 *       - Stock Logs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_product
 *               - stok_baru
 *             properties:
 *               id_product:
 *                 type: integer
 *                 example: 1
 *               stok_baru:
 *                 type: integer
 *                 example: 100
 *               keterangan:
 *                 type: string
 *                 example: Koreksi stok opname
 *     responses:
 *       201:
 *         description: Penyesuaian stok berhasil disimpan
 */
router.post(
  "/adjustment",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  stockAdjustment
)

module.exports = router