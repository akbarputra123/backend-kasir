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
 *     description: >
 *       Membuat transaksi baru. Sistem akan menghitung diskon produk,
 *       tambahan harga varian (Coffee Shop), PPN toko, dan grand total secara otomatis.
 *       Untuk produk yang memiliki varian, kirimkan daftar id_variant_option
 *       pada field variant_options. Untuk produk tanpa varian (Retail),
 *       field variant_options boleh dikosongkan atau tidak dikirim.
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
 *                 description: Wajib untuk owner. Admin dan kasir otomatis menggunakan toko dari token login.
 *
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
 *                       example: 10
 *                       description: ID produk
 *
 *                     qty:
 *                       type: integer
 *                       example: 2
 *                       description: Jumlah pembelian
 *
 *                     variant_options:
 *                       type: array
 *                       nullable: true
 *                       description: >
 *                         Daftar ID option varian yang dipilih.
 *                         Opsional. Digunakan untuk Coffee Shop/Kedai.
 *                         Retail tidak perlu mengirim field ini.
 *                       items:
 *                         type: integer
 *                       example:
 *                         - 3
 *                         - 7
 *
 *               metode_pembayaran:
 *                 type: string
 *                 enum:
 *                   - tunai
 *                   - transfer
 *                   - qris
 *                   - debit
 *                   - ewallet
 *                 example: tunai
 *
 *               jumlah_bayar:
 *                 type: number
 *                 example: 50000
 *
 *               catatan:
 *                 type: string
 *                 nullable: true
 *                 example: Pembelian Coffee Shop
 *
 *           examples:
 *
 *             retail:
 *               summary: Contoh transaksi Retail
 *               value:
 *                 id_store: 1
 *                 items:
 *                   - id_product: 1
 *                     qty: 2
 *                   - id_product: 5
 *                     qty: 1
 *                 metode_pembayaran: tunai
 *                 jumlah_bayar: 100000
 *                 catatan: Pembelian retail
 *
 *             coffee_shop:
 *               summary: Contoh transaksi Coffee Shop
 *               value:
 *                 id_store: 1
 *                 items:
 *                   - id_product: 10
 *                     qty: 1
 *                     variant_options:
 *                       - 3
 *                       - 7
 *                       - 10
 *                 metode_pembayaran: qris
 *                 jumlah_bayar: 50000
 *                 catatan: Latte Large Ice Extra Shot
 *
 *     responses:
 *       201:
 *         description: Transaksi berhasil disimpan
 *
 *       400:
 *         description: Validasi gagal
 *
 *       401:
 *         description: Token tidak valid
 *
 *       403:
 *         description: Tidak memiliki akses
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