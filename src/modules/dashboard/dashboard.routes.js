const express = require("express")

const {
  getDashboard
} = require("./dashboard.controller")

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
| DASHBOARD ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/dashboard
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Ambil data dashboard
 *     description: Mengambil ringkasan dashboard sesuai role login. Owner melihat semua toko miliknya, admin melihat toko sendiri, kasir melihat ringkasan transaksi dirinya. Dashboard sudah mencakup total transaksi, pendapatan, subtotal, diskon produk, PPN, produk terlaris, transaksi terbaru, produk stok menipis, dan grafik penjualan.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit_top_products
 *         schema:
 *           type: integer
 *         example: 5
 *         description: Batas jumlah produk terlaris yang ditampilkan.
 *       - in: query
 *         name: limit_recent_transactions
 *         schema:
 *           type: integer
 *         example: 5
 *         description: Batas jumlah transaksi terbaru yang ditampilkan.
 *       - in: query
 *         name: limit_low_stock
 *         schema:
 *           type: integer
 *         example: 10
 *         description: Batas jumlah produk stok menipis yang ditampilkan.
 *     responses:
 *       200:
 *         description: Data dashboard berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses atau langganan belum aktif
 */
router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getDashboard
)

module.exports = router