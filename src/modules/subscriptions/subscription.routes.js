const express = require("express")

const {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription
} = require("./subscription.controller")

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
 *     summary: Checkout paket langganan
 *     description: Owner memilih paket langganan dan membuat invoice pending.
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
 *               metode_pembayaran:
 *                 type: string
 *                 enum: [manual_transfer, qris_manual]
 *                 example: manual_transfer
 *               catatan:
 *                 type: string
 *                 example: Checkout paket Basic
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
 *     summary: Aktifkan subscription
 *     description: Aktivasi manual subscription. Untuk production, endpoint ini sebaiknya hanya untuk super admin.
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
  authorizeRoles("owner"),
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
  authorizeRoles("owner"),
  cancelSubscription
)

module.exports = router