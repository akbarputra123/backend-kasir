const express = require("express")

const router = express.Router()

const {
  authMiddleware,
  authorizeRoles,
} = require("../../middlewares/authMiddleware")

const notificationController = require("./notification.controller")

/*
|--------------------------------------------------------------------------
| AUTHORIZATION
|--------------------------------------------------------------------------
|
| Semua endpoint notification hanya dapat diakses oleh OWNER.
|
| Flow:
|
| Request
|   ↓
| authMiddleware
|   ↓
| verify JWT
|   ↓
| authorizeRoles("owner")
|   ↓
| notification controller
|
|--------------------------------------------------------------------------
*/

router.use(
  authMiddleware,
  authorizeRoles("owner")
)


/*
|--------------------------------------------------------------------------
| GET ALL NOTIFICATIONS
|--------------------------------------------------------------------------
|
| GET /api/notifications
|
| Query:
| ?limit=20
| ?offset=0
|
| Hanya OWNER.
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  notificationController.getAll
)


/*
|--------------------------------------------------------------------------
| GET UNREAD NOTIFICATIONS
|--------------------------------------------------------------------------
|
| GET /api/notifications/unread
|
|--------------------------------------------------------------------------
*/

router.get(
  "/unread",
  notificationController.getUnread
)


/*
|--------------------------------------------------------------------------
| GET UNREAD COUNT
|--------------------------------------------------------------------------
|
| GET /api/notifications/unread-count
|
| Digunakan untuk badge:
|
| 🔔 5
|
|--------------------------------------------------------------------------
*/

router.get(
  "/unread-count",
  notificationController.getUnreadCount
)


/*
|--------------------------------------------------------------------------
| GET LATEST NOTIFICATIONS
|--------------------------------------------------------------------------
|
| GET /api/notifications/latest
|
| Contoh:
| ?limit=5
|
|--------------------------------------------------------------------------
*/

router.get(
  "/latest",
  notificationController.getLatest
)


/*
|--------------------------------------------------------------------------
| MARK ALL AS READ
|--------------------------------------------------------------------------
|
| PATCH /api/notifications/read-all
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/read-all",
  notificationController.markAllAsRead
)


/*
|--------------------------------------------------------------------------
| DELETE ALL READ NOTIFICATIONS
|--------------------------------------------------------------------------
|
| DELETE /api/notifications/read
|
|--------------------------------------------------------------------------
*/

router.delete(
  "/read",
  notificationController.removeAllRead
)


/*
|--------------------------------------------------------------------------
| CREATE GENERAL NOTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/notifications
|
| Hanya OWNER.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  notificationController.create
)


/*
|--------------------------------------------------------------------------
| CREATE STOCK NOTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/notifications/stock
|
| Catatan:
|
| Service akan tetap melakukan pengecekan:
|
| id_business_category = 1
| → Toko / Grosir
| → boleh membuat notifikasi stock
|
| id_business_category = 2
| → Coffee / Kedai
| → tidak membuat notifikasi stock
|
|--------------------------------------------------------------------------
*/

router.post(
  "/stock",
  notificationController.notifyStock
)


/*
|--------------------------------------------------------------------------
| NEW ORDER NOTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/notifications/new-order
|
|--------------------------------------------------------------------------
*/

router.post(
  "/new-order",
  notificationController.notifyNewOrder
)


/*
|--------------------------------------------------------------------------
| PAYMENT SUCCESS NOTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/notifications/payment-success
|
|--------------------------------------------------------------------------
*/

router.post(
  "/payment-success",
  notificationController.notifyPaymentSuccess
)


/*
|--------------------------------------------------------------------------
| UNPAID ORDER NOTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/notifications/unpaid-order
|
|--------------------------------------------------------------------------
*/

router.post(
  "/unpaid-order",
  notificationController.notifyUnpaidOrder
)


/*
|--------------------------------------------------------------------------
| TRANSACTION CANCELLED NOTIFICATION
|--------------------------------------------------------------------------
|
| POST /api/notifications/transaction-cancelled
|
|--------------------------------------------------------------------------
*/

router.post(
  "/transaction-cancelled",
  notificationController.notifyTransactionCancelled
)


/*
|--------------------------------------------------------------------------
| GET NOTIFICATION DETAIL
|--------------------------------------------------------------------------
|
| GET /api/notifications/:id
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  notificationController.getById
)


/*
|--------------------------------------------------------------------------
| MARK ONE NOTIFICATION AS READ
|--------------------------------------------------------------------------
|
| PATCH /api/notifications/:id/read
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/read",
  notificationController.markAsRead
)


/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
|
| DELETE /api/notifications/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  notificationController.remove
)


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router