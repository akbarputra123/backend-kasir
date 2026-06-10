const express = require("express")

const {
  getReceiptByTransaction
} = require("./receipt.controller")

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
| RECEIPT ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/receipts
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /receipts/{id_transaction}:
 *   get:
 *     summary: Ambil data struk transaksi
 *     description: Mengambil data struk transaksi untuk kebutuhan cetak, termasuk data toko, kasir, transaksi, item transaksi, harga asli produk, diskon produk, harga setelah diskon, PPN toko, grand total, jumlah bayar, dan kembalian.
 *     tags:
 *       - Receipts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_transaction
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID transaksi
 *     responses:
 *       200:
 *         description: Data struk berhasil diambil
 *       400:
 *         description: Gagal mengambil data struk
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses atau langganan belum aktif
 */
router.get(
  "/:id_transaction",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getReceiptByTransaction
)

module.exports = router