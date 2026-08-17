const express = require("express");

const router = express.Router();

const {
    authMiddleware,
    authorizeRoles,
} = require("../../middlewares/authMiddleware");

const notificationController =
    require("./notification.controller");


/**
 * ============================================================
 * AUTHORIZATION
 * ============================================================
 *
 * Semua endpoint notification hanya dapat diakses oleh OWNER.
 *
 * Flow:
 *
 * Request
 *    ↓
 * authMiddleware
 *    ↓
 * verify JWT
 *    ↓
 * authorizeRoles("owner")
 *    ↓
 * notification controller
 *
 * ============================================================
 */

router.use(
    authMiddleware,
    authorizeRoles("owner")
);


/**
 * ============================================================
 * GET ALL NOTIFICATIONS
 * ============================================================
 *
 * GET /api/notifications
 *
 * Query:
 *
 * ?limit=20
 * ?offset=0
 *
 * Contoh:
 *
 * GET /api/notifications?limit=20&offset=0
 *
 * ============================================================
 */

router.get(
    "/",
    notificationController.getAll
);


/**
 * ============================================================
 * GET UNREAD NOTIFICATIONS
 * ============================================================
 *
 * GET /api/notifications/unread
 *
 * Mengambil semua notifikasi yang belum dibaca.
 *
 * ============================================================
 */

router.get(
    "/unread",
    notificationController.getUnread
);


/**
 * ============================================================
 * GET UNREAD COUNT
 * ============================================================
 *
 * GET /api/notifications/unread-count
 *
 * Digunakan untuk badge notification.
 *
 * Contoh:
 *
 * 🔔 5
 *
 * ============================================================
 */

router.get(
    "/unread-count",
    notificationController.getUnreadCount
);


/**
 * ============================================================
 * GET LATEST NOTIFICATIONS
 * ============================================================
 *
 * GET /api/notifications/latest
 *
 * Query:
 *
 * ?limit=5
 *
 * Digunakan untuk dropdown notification.
 *
 * ============================================================
 */

router.get(
    "/latest",
    notificationController.getLatest
);


/**
 * ============================================================
 * SUBSCRIPTION STATUS
 * ============================================================
 *
 * GET /api/notifications/subscription/status
 *
 * HANYA OWNER.
 *
 * Digunakan untuk mengambil status subscription owner.
 *
 * Informasi yang dapat digunakan:
 *
 * - paket
 * - tanggal mulai
 * - tanggal berakhir
 * - status
 * - sisa hari
 *
 * ============================================================
 */

router.get(
    "/subscription/status",
    notificationController.getSubscriptionStatus
);


/**
 * ============================================================
 * CHECK SUBSCRIPTION NOTIFICATION
 * ============================================================
 *
 * GET /api/notifications/subscription/check
 *
 * HANYA OWNER.
 *
 * Digunakan untuk mengecek subscription owner.
 *
 * Jika hampir expired:
 *
 * subscription_hampir_expired
 *
 * Jika sudah expired:
 *
 * subscription_expired
 *
 * Jika masih aman:
 *
 * tidak membuat notifikasi.
 *
 * ============================================================
 */

router.get(
    "/subscription/check",
    notificationController.checkSubscriptionNotification
);


/**
 * ============================================================
 * CHECK ALL SUBSCRIPTION NOTIFICATIONS
 * ============================================================
 *
 * POST /api/notifications/subscription/check-all
 *
 * HANYA OWNER.
 *
 * Endpoint ini menjalankan pengecekan subscription.
 *
 * Cocok digunakan oleh:
 *
 * - scheduler
 * - cron
 * - manual testing
 *
 * ============================================================
 */

router.post(
    "/subscription/check-all",
    notificationController.checkAllSubscriptionNotifications
);


/**
 * ============================================================
 * MARK ALL AS READ
 * ============================================================
 *
 * PATCH /api/notifications/read-all
 *
 * Menandai semua notifikasi sebagai sudah dibaca.
 *
 * ============================================================
 */

router.patch(
    "/read-all",
    notificationController.markAllAsRead
);


/**
 * ============================================================
 * DELETE ALL READ NOTIFICATIONS
 * ============================================================
 *
 * DELETE /api/notifications/read
 *
 * Menghapus semua notifikasi yang sudah dibaca.
 *
 * ============================================================
 */

router.delete(
    "/read",
    notificationController.removeAllRead
);


/**
 * ============================================================
 * CREATE GENERAL NOTIFICATION
 * ============================================================
 *
 * POST /api/notifications
 *
 * Hanya OWNER.
 *
 * Body:
 *
 * {
 *   "tipe": "informasi",
 *   "judul": "Informasi",
 *   "pesan": "Pesan notifikasi"
 * }
 *
 * ============================================================
 */

router.post(
    "/",
    notificationController.create
);


/**
 * ============================================================
 * CREATE STOCK NOTIFICATION
 * ============================================================
 *
 * POST /api/notifications/stock
 *
 * Service akan mengecek kategori bisnis.
 *
 * ID BUSINESS CATEGORY:
 *
 * 1
 * → Toko / Grosir
 * → menggunakan stock
 * → BOLEH membuat notifikasi stock
 *
 * 2
 * → Coffee / Kedai
 * → tidak menggunakan stock
 * → TIDAK membuat notifikasi stock
 *
 * ============================================================
 */

router.post(
    "/stock",
    notificationController.notifyStock
);


/**
 * ============================================================
 * NEW ORDER NOTIFICATION
 * ============================================================
 *
 * POST /api/notifications/new-order
 *
 * Untuk notifikasi pesanan baru.
 *
 * ============================================================
 */

router.post(
    "/new-order",
    notificationController.notifyNewOrder
);


/**
 * ============================================================
 * PAYMENT SUCCESS NOTIFICATION
 * ============================================================
 *
 * POST /api/notifications/payment-success
 *
 * Untuk notifikasi pembayaran berhasil.
 *
 * ============================================================
 */

router.post(
    "/payment-success",
    notificationController.notifyPaymentSuccess
);


/**
 * ============================================================
 * UNPAID ORDER NOTIFICATION
 * ============================================================
 *
 * POST /api/notifications/unpaid-order
 *
 * Untuk pesanan yang belum dibayar.
 *
 * Mendukung nama pelanggan.
 *
 * ============================================================
 */

router.post(
    "/unpaid-order",
    notificationController.notifyUnpaidOrder
);


/**
 * ============================================================
 * TRANSACTION CANCELLED NOTIFICATION
 * ============================================================
 *
 * POST /api/notifications/transaction-cancelled
 *
 * Untuk transaksi yang dibatalkan.
 *
 * ============================================================
 */

router.post(
    "/transaction-cancelled",
    notificationController.notifyTransactionCancelled
);


/**
 * ============================================================
 * GET NOTIFICATION DETAIL
 * ============================================================
 *
 * GET /api/notifications/:id
 *
 * PENTING:
 *
 * Route ini diletakkan setelah semua route statis
 * seperti:
 *
 * /subscription/status
 * /subscription/check
 * /subscription/check-all
 * /unread
 * /latest
 * /read
 *
 * supaya ":id" tidak menangkap URL tersebut.
 *
 * ============================================================
 */

router.get(
    "/:id",
    notificationController.getById
);


/**
 * ============================================================
 * MARK ONE NOTIFICATION AS READ
 * ============================================================
 *
 * PATCH /api/notifications/:id/read
 *
 * ============================================================
 */

router.patch(
    "/:id/read",
    notificationController.markAsRead
);


/**
 * ============================================================
 * DELETE NOTIFICATION
 * ============================================================
 *
 * DELETE /api/notifications/:id
 *
 * ============================================================
 */

router.delete(
    "/:id",
    notificationController.remove
);


/**
 * ============================================================
 * EXPORT ROUTER
 * ============================================================
 */

module.exports = router;