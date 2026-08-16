const express = require("express")
const {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription,
  deleteSubscription,
  upgradeSubscription,
  extendSubscription,
  getAllSubscriptions,
  getSubscriptionByInvoice,
} = require("./subscription.controller");
const {
  authMiddleware,
  authorizeRoles
} = require("../../middlewares/authMiddleware")

const router = express.Router()

/*
|--------------------------------------------------------------------------
| SUBSCRIPTION ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/subscriptions
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Ambil paket langganan
 *     description: Mengambil daftar paket langganan aktif.
 *     tags:
 *       - Subscriptions
 *     responses:
 *       200:
 *         description: Data paket langganan berhasil diambil
 */
router.get(
  "/plans",
  getPlans
)

/**
 * @swagger
 * /subscriptions/my-subscription:
 *   get:
 *     summary: Ambil status langganan saya
 *     description: Mengambil status langganan owner dari user yang sedang login.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data langganan berhasil diambil
 */
router.get(
  "/my-subscription",
  authMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  getMySubscription
)

/**
 * @swagger
 * /subscriptions/checkout:
 *   post:
 *     summary: Checkout paket langganan (dengan jumlah bulan)
 *     description: Owner memilih paket dan jumlah bulan untuk membuat invoice pending.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_plan
 *             properties:
 *               id_plan:
 *                 type: integer
 *                 example: 1
 *               jumlah_bulan:
 *                 type: integer
 *                 example: 3
 *                 default: 1
 *               metode_pembayaran:
 *                 type: string
 *                 enum: [manual_transfer, qris_manual]
 *                 example: manual_transfer
 *               catatan:
 *                 type: string
 *                 example: Checkout paket Business 3 bulan
 *     responses:
 *       201:
 *         description: Checkout langganan berhasil dibuat
 */
router.post(
  "/checkout",
  authMiddleware,
  authorizeRoles("owner"),
  checkoutSubscription
)

/**
 * @swagger
 * /subscriptions/activate/{id_subscription}:
 *   post:
 *     summary: Aktifkan subscription (hanya super_admin)
 *     description: Aktivasi manual subscription. Hanya dapat diakses oleh super_admin.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_subscription
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subscription
 *     responses:
 *       200:
 *         description: Langganan berhasil diaktifkan
 */
router.post(
  "/activate/:id_subscription",
  authMiddleware,
  authorizeRoles("super_admin"),
  activateSubscription
)

/**
 * @swagger
 * /subscriptions/cancel/{id_subscription}:
 *   post:
 *     summary: Batalkan subscription pending
 *     description: Owner membatalkan invoice subscription yang masih pending.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_subscription
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subscription
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               catatan:
 *                 type: string
 *                 example: Salah memilih paket
 *     responses:
 *       200:
 *         description: Langganan berhasil dibatalkan
 */
router.post(
  "/cancel/:id_subscription",
  authMiddleware,
  authorizeRoles("super_admin", "owner"),
  cancelSubscription
)

/**
 * @swagger
 * /subscriptions/{id_subscription}:
 *   delete:
 *     summary: Hapus subscription
 *     description: Menghapus subscription yang berstatus pending atau dibatalkan. Hanya dapat diakses oleh super_admin.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_subscription
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription berhasil dihapus
 */
router.delete(
  "/:id_subscription",
  authMiddleware,
  authorizeRoles("super_admin"),
  deleteSubscription
);

/**
 * @swagger
 * /subscriptions/upgrade/{id_subscription}:
 *   post:
 *     summary: Upgrade ke paket lebih tinggi (reset masa berlaku)
 *     description: Owner mengganti plan aktif ke plan yang lebih mahal, dengan jumlah bulan tertentu. Masa berlaku dihitung ulang dari sekarang.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_subscription
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subscription aktif
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_plan_id
 *             properties:
 *               new_plan_id:
 *                 type: integer
 *                 example: 2
 *               jumlah_bulan:
 *                 type: integer
 *                 example: 3
 *                 default: 1
 *     responses:
 *       200:
 *         description: Langganan berhasil di-upgrade
 */
router.post(
  "/upgrade/:id_subscription",
  authMiddleware,
  authorizeRoles("owner"),
  upgradeSubscription
)

/**
 * @swagger
 * /subscriptions/extend/{id_subscription}:
 *   post:
 *     summary: Perpanjang masa aktif (tambah bulan, tanpa reset)
 *     description: Owner menambahkan bulan ke masa aktif yang sedang berjalan. Tidak mengubah tanggal mulai, hanya memperpanjang tanggal berakhir.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_subscription
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subscription aktif
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - additional_months
 *             properties:
 *               additional_months:
 *                 type: integer
 *                 example: 2
 *               catatan:
 *                 type: string
 *                 example: Perpanjangan 2 bulan
 *     responses:
 *       200:
 *         description: Langganan berhasil diperpanjang
 */
router.post(
  "/extend/:id_subscription",
  authMiddleware,
  authorizeRoles("owner"),
  extendSubscription
)

// ============================================================
// ROUTE KHUSUS SUPER_ADMIN DAN CEK INVOICE
// ============================================================

/**
 * @swagger
 * /subscriptions/all:
 *   get:
 *     summary: Ambil semua subscription
 *     description: Mengambil seluruh data subscription yang ada di sistem. Endpoint ini hanya dapat diakses oleh super_admin.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data semua subscription berhasil diambil
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Akses ditolak, hanya super_admin
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get(
  "/all",
  authMiddleware,
  authorizeRoles("super_admin"),
  getAllSubscriptions
);
/**
 * @swagger
 * /subscriptions/invoice/{kode_invoice}:
 *   get:
 *     summary: Cek status invoice berdasarkan kode invoice
 *     description: Mendapatkan detail subscription berdasarkan kode invoice. Super_admin dapat mengakses semua, owner hanya miliknya sendiri.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kode_invoice
 *         required: true
 *         schema:
 *           type: string
 *         description: "Kode invoice (contoh: INV-SIOPOS-20260726-1234)"
 *     responses:
 *       200:
 *         description: Data subscription berhasil diambil
 */
router.get(
  "/invoice/:kode_invoice",
  authMiddleware,
  authorizeRoles("super_admin", "owner", "admin", "kasir"),
  getSubscriptionByInvoice
)

module.exports = router