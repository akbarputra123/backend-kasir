const express = require("express")

const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  cancelTransaction
} = require("./transaction.controller")

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
| TRANSACTION ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/transactions
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Ambil semua transaksi
 *     description: Owner melihat semua transaksi toko miliknya. Admin/kasir melihat transaksi toko sendiri.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data transaksi berhasil diambil
 */
router.get(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getAllTransactions
)

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Ambil detail transaksi
 *     description: Mengambil detail transaksi beserta item transaksi, termasuk harga asli, diskon produk, harga final, PPN, dan grand total.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi
 *     responses:
 *       200:
 *         description: Detail transaksi berhasil diambil
 *       404:
 *         description: Transaksi tidak ditemukan
 */
router.get(
  "/:id",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getTransactionById
)

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Buat transaksi kasir
 *     description: Membuat transaksi baru. Diskon produk dihitung otomatis dari data produk dan tabel discounts. PPN dihitung otomatis dari pengaturan toko pada stores.ppn_aktif dan stores.ppn_persen. Sistem juga menyimpan item transaksi, mengurangi stok produk, dan membuat stock_logs otomatis.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - jumlah_bayar
 *             properties:
 *               id_store:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Wajib untuk owner. Admin/kasir otomatis memakai id_store dari token.
 *               items:
 *                 type: array
 *                 description: Daftar produk yang dibeli.
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_product
 *                     - qty
 *                   properties:
 *                     id_product:
 *                       type: integer
 *                       example: 1
 *                     qty:
 *                       type: integer
 *                       example: 2
 *               metode_pembayaran:
 *                 type: string
 *                 enum: [tunai, transfer, qris, debit, ewallet]
 *                 example: tunai
 *               jumlah_bayar:
 *                 type: number
 *                 example: 20000
 *               catatan:
 *                 type: string
 *                 nullable: true
 *                 example: Pembelian normal
 *     responses:
 *       201:
 *         description: Transaksi berhasil disimpan
 *       400:
 *         description: Gagal menyimpan transaksi
 */
router.post(
  "/",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  createTransaction
)

/**
 * @swagger
 * /transactions/{id}/cancel:
 *   post:
 *     summary: Batalkan transaksi
 *     description: Membatalkan transaksi dan mengembalikan stok produk. Hanya owner atau admin yang dapat membatalkan transaksi.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               catatan:
 *                 type: string
 *                 nullable: true
 *                 example: Pembeli membatalkan transaksi
 *     responses:
 *       200:
 *         description: Transaksi berhasil dibatalkan
 *       400:
 *         description: Gagal membatalkan transaksi
 */
router.post(
  "/:id/cancel",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "kasir","admin"),
  cancelTransaction
)

module.exports = router