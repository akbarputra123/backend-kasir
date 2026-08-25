const notificationModel = require("./notification.model");
const notificationService = require("./notification.service");

/**
 * ============================================================
 * HELPER
 * ============================================================
 */

/**
 * Ambil ID user dari middleware authentication.
 * Mendukung: req.user.id_user / req.user.idUser
 */
const getUserId = (req) => req.user?.id_user ?? req.user?.idUser ?? null;

/**
 * Ambil ID store dari middleware authentication.
 * Mendukung: req.user.id_store / req.user.idStore
 */
const getStoreId = (req) => req.user?.id_store ?? req.user?.idStore ?? null;

/**
 * Ambil role user.
 */
const getUserRole = (req) => {
  const role = req.user?.role ?? req.user?.peran ?? req.user?.level ?? req.user?.tipe_user ?? "";
  return String(role).toLowerCase().trim();
};

/**
 * Cek apakah user adalah owner.
 */
const isOwner = (req) => getUserRole(req) === "owner";

/**
 * Response jika bukan owner.
 */
const requireOwner = (req, res) => {
  if (!isOwner(req)) {
    res.status(403).json({
      success: false,
      message: "Fitur notifikasi subscription hanya dapat diakses oleh owner.",
    });
    return false;
  }
  return true;
};

/**
 * Konversi nilai menjadi integer positif.
 */
const parsePositiveInt = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) return defaultValue;
  return parsed;
};

/**
 * ============================================================
 * GET ALL NOTIFICATIONS
 * ============================================================
 * GET /api/notifications
 * Query: ?limit=20 & ?offset=0
 */
const getAll = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const offset = parsePositiveInt(req.query.offset, 0);

    const notifications = await notificationModel.findAllByUser({
      idUser,
      idStore,
      limit,
      offset,
    });

    const unreadCount = await notificationModel.countUnreadByUser({ idUser, idStore });

    return res.status(200).json({
      success: true,
      message: "Notifikasi berhasil diambil.",
      data: notifications,
      unread_count: unreadCount,
      pagination: { limit, offset, count: notifications.length },
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil notifikasi." });
  }
};

/**
 * ============================================================
 * GET UNREAD NOTIFICATIONS
 * ============================================================
 * GET /api/notifications/unread
 */
const getUnread = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const offset = parsePositiveInt(req.query.offset, 0);

    const notifications = await notificationModel.findUnreadByUser({
      idUser,
      idStore,
      limit,
      offset,
    });

    const unreadCount = await notificationModel.countUnreadByUser({ idUser, idStore });

    return res.status(200).json({
      success: true,
      message: "Notifikasi belum dibaca berhasil diambil.",
      data: notifications,
      unread_count: unreadCount,
      pagination: { limit, offset, count: notifications.length },
    });
  } catch (error) {
    console.error("GET UNREAD NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil notifikasi belum dibaca." });
  }
};

/**
 * ============================================================
 * GET UNREAD COUNT
 * ============================================================
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const unreadCount = await notificationModel.countUnreadByUser({ idUser, idStore });

    return res.status(200).json({
      success: true,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error("GET UNREAD COUNT ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil jumlah notifikasi." });
  }
};

/**
 * ============================================================
 * GET LATEST NOTIFICATIONS
 * ============================================================
 * GET /api/notifications/latest?limit=5
 */
const getLatest = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const limit = Math.min(parsePositiveInt(req.query.limit, 5), 20);

    const notifications = await notificationModel.findLatestByUser({
      idUser,
      idStore,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Notifikasi terbaru berhasil diambil.",
      data: notifications,
    });
  } catch (error) {
    console.error("GET LATEST NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil notifikasi terbaru." });
  }
};

/**
 * ============================================================
 * GET NOTIFICATION DETAIL
 * ============================================================
 * GET /api/notifications/:id
 * ID sekarang adalah string (Firestore document ID)
 */
const getById = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idNotification = req.params.id; // string

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    if (!idNotification) {
      return res.status(400).json({ success: false, message: "ID notifikasi tidak valid." });
    }

    const notification = await notificationModel.findById({
      idNotification,
      idUser,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notifikasi tidak ditemukan." });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("GET NOTIFICATION DETAIL ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil detail notifikasi." });
  }
};

/**
 * ============================================================
 * CREATE NOTIFICATION
 * ============================================================
 * POST /api/notifications
 */
const create = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const { tipe, judul, pesan, reference_type, reference_id } = req.body;

    if (!tipe) return res.status(400).json({ success: false, message: "Tipe notifikasi wajib diisi." });
    if (!judul) return res.status(400).json({ success: false, message: "Judul notifikasi wajib diisi." });
    if (!pesan) return res.status(400).json({ success: false, message: "Pesan notifikasi wajib diisi." });

    const notification = await notificationService.createNotification({
      idUser,
      idStore,
      tipe,
      judul,
      pesan,
      referenceType: reference_type ?? null,
      referenceId: reference_id ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Notifikasi berhasil dibuat.",
      data: notification,
    });
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal membuat notifikasi." });
  }
};

/**
 * ============================================================
 * MARK ONE AS READ
 * ============================================================
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idNotification = req.params.id; // string

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    if (!idNotification) {
      return res.status(400).json({ success: false, message: "ID notifikasi tidak valid." });
    }

    const notification = await notificationModel.findById({ idNotification, idUser });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notifikasi tidak ditemukan." });
    }

    const updated = await notificationModel.markAsRead({ idNotification, idUser });

    return res.status(200).json({
      success: true,
      message: updated ? "Notifikasi ditandai sudah dibaca." : "Notifikasi sudah dibaca.",
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal menandai notifikasi." });
  }
};

/**
 * ============================================================
 * MARK ALL AS READ
 * ============================================================
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const affectedRows = await notificationModel.markAllAsRead({ idUser, idStore });

    return res.status(200).json({
      success: true,
      message: "Semua notifikasi berhasil ditandai sudah dibaca.",
      updated_count: affectedRows,
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal menandai semua notifikasi." });
  }
};

/**
 * ============================================================
 * DELETE NOTIFICATION
 * ============================================================
 * DELETE /api/notifications/:id
 */
const remove = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idNotification = req.params.id; // string

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    if (!idNotification) {
      return res.status(400).json({ success: false, message: "ID notifikasi tidak valid." });
    }

    const notification = await notificationModel.findById({ idNotification, idUser });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notifikasi tidak ditemukan." });
    }

    await notificationModel.remove({ idNotification, idUser });

    return res.status(200).json({
      success: true,
      message: "Notifikasi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal menghapus notifikasi." });
  }
};

/**
 * ============================================================
 * DELETE ALL READ NOTIFICATIONS
 * ============================================================
 * DELETE /api/notifications/read
 */
const removeAllRead = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const affectedRows = await notificationModel.removeAllRead({ idUser, idStore });

    return res.status(200).json({
      success: true,
      message: "Semua notifikasi yang sudah dibaca berhasil dihapus.",
      deleted_count: affectedRows,
    });
  } catch (error) {
    console.error("DELETE READ NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal menghapus notifikasi." });
  }
};

/**
 * ============================================================
 * NOTIFY STOCK
 * ============================================================
 * POST /api/notifications/stock
 */
const notifyStock = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }
    if (!idStore) {
      return res.status(400).json({ success: false, message: "Toko tidak ditemukan." });
    }

    const { id_product, nama_produk, stok, stok_minimum } = req.body;
    if (!id_product) return res.status(400).json({ success: false, message: "ID produk wajib diisi." });
    if (!nama_produk) return res.status(400).json({ success: false, message: "Nama produk wajib diisi." });

    const notification = await notificationService.notifyStock({
      idUser,
      idStore,
      idProduct: id_product,
      namaProduk: nama_produk,
      stok,
      stokMinimum: stok_minimum,
    });

    if (!notification) {
      return res.status(200).json({
        success: true,
        notification_created: false,
        message: "Tidak ada notifikasi stok yang dibuat.",
      });
    }

    return res.status(201).json({
      success: true,
      notification_created: true,
      message: "Notifikasi stok berhasil dibuat.",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFY STOCK ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal membuat notifikasi stok." });
  }
};

/**
 * ============================================================
 * NOTIFY NEW ORDER
 * ============================================================
 * POST /api/notifications/order/new
 */
const notifyNewOrder = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const { id_transaction, kode_transaksi, nama_pelanggan, grand_total } = req.body;
    if (!id_transaction) return res.status(400).json({ success: false, message: "ID transaksi wajib diisi." });
    if (!kode_transaksi) return res.status(400).json({ success: false, message: "Kode transaksi wajib diisi." });

    const notification = await notificationService.notifyNewOrder({
      idUser,
      idStore,
      idTransaction: id_transaction,
      kodeTransaksi: kode_transaksi,
      namaPelanggan: nama_pelanggan ?? null,
      grandTotal: grand_total ?? 0,
    });

    return res.status(201).json({
      success: true,
      message: "Notifikasi pesanan berhasil dibuat.",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFY NEW ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal membuat notifikasi pesanan." });
  }
};

/**
 * ============================================================
 * NOTIFY PAYMENT SUCCESS
 * ============================================================
 * POST /api/notifications/payment/success
 */
const notifyPaymentSuccess = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const { id_transaction, kode_transaksi, grand_total } = req.body;
    if (!id_transaction) return res.status(400).json({ success: false, message: "ID transaksi wajib diisi." });
    if (!kode_transaksi) return res.status(400).json({ success: false, message: "Kode transaksi wajib diisi." });

    const notification = await notificationService.notifyPaymentSuccess({
      idUser,
      idStore,
      idTransaction: id_transaction,
      kodeTransaksi: kode_transaksi,
      grandTotal: grand_total ?? 0,
    });

    return res.status(201).json({
      success: true,
      message: "Notifikasi pembayaran berhasil dibuat.",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFY PAYMENT SUCCESS ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal membuat notifikasi pembayaran." });
  }
};

/**
 * ============================================================
 * NOTIFY UNPAID ORDER
 * ============================================================
 * POST /api/notifications/order/unpaid
 */
const notifyUnpaidOrder = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const { id_transaction, kode_transaksi, nama_pelanggan, grand_total } = req.body;
    if (!id_transaction) return res.status(400).json({ success: false, message: "ID transaksi wajib diisi." });
    if (!kode_transaksi) return res.status(400).json({ success: false, message: "Kode transaksi wajib diisi." });

    const notification = await notificationService.notifyUnpaidOrder({
      idUser,
      idStore,
      idTransaction: id_transaction,
      kodeTransaksi: kode_transaksi,
      namaPelanggan: nama_pelanggan ?? null,
      grandTotal: grand_total ?? 0,
    });

    return res.status(201).json({
      success: true,
      message: "Notifikasi pesanan belum bayar berhasil dibuat.",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFY UNPAID ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal membuat notifikasi pesanan belum bayar." });
  }
};

/**
 * ============================================================
 * NOTIFY TRANSACTION CANCELLED
 * ============================================================
 * POST /api/notifications/transaction/cancelled
 */
const notifyTransactionCancelled = async (req, res) => {
  try {
    const idUser = getUserId(req);
    const idStore = getStoreId(req);

    if (!idUser) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const { id_transaction, kode_transaksi } = req.body;
    if (!id_transaction) return res.status(400).json({ success: false, message: "ID transaksi wajib diisi." });
    if (!kode_transaksi) return res.status(400).json({ success: false, message: "Kode transaksi wajib diisi." });

    const notification = await notificationService.notifyTransactionCancelled({
      idUser,
      idStore,
      idTransaction: id_transaction,
      kodeTransaksi: kode_transaksi,
    });

    return res.status(201).json({
      success: true,
      message: "Notifikasi transaksi dibatalkan berhasil dibuat.",
      data: notification,
    });
  } catch (error) {
    console.error("NOTIFY TRANSACTION CANCELLED ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal membuat notifikasi transaksi dibatalkan." });
  }
};

/**
 * ============================================================
 * CHECK SUBSCRIPTION NOTIFICATION
 * ============================================================
 * GET /api/notifications/subscription/check
 * HANYA OWNER.
 */
const checkSubscriptionNotification = async (req, res) => {
  try {
    if (!requireOwner(req, res)) return;

    const idOwner = getUserId(req);
    if (!idOwner) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const result = await notificationService.checkSubscriptionNotificationForOwner({ idOwner });

    return res.status(200).json({
      success: true,
      message: "Status notifikasi subscription berhasil diperiksa.",
      data: result,
    });
  } catch (error) {
    console.error("CHECK SUBSCRIPTION NOTIFICATION ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal memeriksa notifikasi subscription." });
  }
};

/**
 * ============================================================
 * GET SUBSCRIPTION STATUS
 * ============================================================
 * GET /api/notifications/subscription/status
 * HANYA OWNER.
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    if (!requireOwner(req, res)) return;

    const idOwner = getUserId(req);
    if (!idOwner) {
      return res.status(401).json({ success: false, message: "User tidak terautentikasi." });
    }

    const status = await notificationService.getSubscriptionStatus({ idOwner });

    return res.status(200).json({
      success: true,
      message: "Status subscription berhasil diambil.",
      data: status,
    });
  } catch (error) {
    console.error("GET SUBSCRIPTION STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil status subscription." });
  }
};

/**
 * ============================================================
 * RUN SUBSCRIPTION NOTIFICATION CHECK (ALL OWNERS)
 * ============================================================
 * POST /api/notifications/subscription/check-all
 * HANYA OWNER.
 */
const checkAllSubscriptionNotifications = async (req, res) => {
  try {
    if (!requireOwner(req, res)) return;

    const result = await notificationService.checkSubscriptionNotifications();

    return res.status(200).json({
      success: true,
      message: "Pengecekan subscription berhasil dijalankan.",
      data: {
        expiring: result.expiring.length,
        expired: result.expired.length,
        notifications: result,
      },
    });
  } catch (error) {
    console.error("CHECK ALL SUBSCRIPTION ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal menjalankan pengecekan subscription." });
  }
};

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */
module.exports = {
  // Notifikasi
  getAll,
  getUnread,
  getUnreadCount,
  getLatest,
  getById,
  create,
  markAsRead,
  markAllAsRead,
  remove,
  removeAllRead,

  // Stok
  notifyStock,

  // Transaksi
  notifyNewOrder,
  notifyPaymentSuccess,
  notifyUnpaidOrder,
  notifyTransactionCancelled,

  // Subscription
  checkSubscriptionNotification,
  checkAllSubscriptionNotifications,
  getSubscriptionStatus,
};