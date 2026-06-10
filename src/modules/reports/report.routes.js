const express = require("express")

const {
  getSummary,
  getDailyReport,
  getMonthlyReport,
  getTopProducts,
  getRecentTransactions,
  getLowStockProducts,
  getDashboardReport
} = require("./report.controller")

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
| REPORT ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/reports
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /reports/summary:
 *   get:
 *     summary: Ambil ringkasan laporan
 *     description: Mengambil total transaksi, total produk terjual, total pendapatan, diskon, pajak, dan rata-rata transaksi.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-01
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-30
 *     responses:
 *       200:
 *         description: Ringkasan laporan berhasil diambil
 */
router.get(
  "/summary",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getSummary
)

/**
 * @swagger
 * /reports/daily:
 *   get:
 *     summary: Ambil laporan harian
 *     description: Mengambil laporan penjualan per hari.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-01
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-30
 *     responses:
 *       200:
 *         description: Laporan harian berhasil diambil
 */
router.get(
  "/daily",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getDailyReport
)

/**
 * @swagger
 * /reports/monthly:
 *   get:
 *     summary: Ambil laporan bulanan
 *     description: Mengambil laporan penjualan per bulan berdasarkan tahun.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         example: 2026
 *     responses:
 *       200:
 *         description: Laporan bulanan berhasil diambil
 */
router.get(
  "/monthly",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getMonthlyReport
)

/**
 * @swagger
 * /reports/top-products:
 *   get:
 *     summary: Ambil produk terlaris
 *     description: Mengambil daftar produk terlaris berdasarkan jumlah qty terjual.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-01
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-30
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Produk terlaris berhasil diambil
 */
router.get(
  "/top-products",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getTopProducts
)

/**
 * @swagger
 * /reports/recent-transactions:
 *   get:
 *     summary: Ambil transaksi terakhir
 *     description: Mengambil daftar transaksi terbaru.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Transaksi terakhir berhasil diambil
 */
router.get(
  "/recent-transactions",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getRecentTransactions
)

/**
 * @swagger
 * /reports/low-stock:
 *   get:
 *     summary: Ambil produk stok menipis
 *     description: Mengambil daftar produk yang stoknya kurang dari atau sama dengan stok minimum.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Produk stok menipis berhasil diambil
 */
router.get(
  "/low-stock",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getLowStockProducts
)

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Ambil data dashboard laporan
 *     description: Mengambil ringkasan laporan, produk terlaris, transaksi terakhir, dan produk stok menipis.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-01
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-06-30
 *     responses:
 *       200:
 *         description: Data dashboard laporan berhasil diambil
 */
router.get(
  "/dashboard",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  getDashboardReport
)

module.exports = router