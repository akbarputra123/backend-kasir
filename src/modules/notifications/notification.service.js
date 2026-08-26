const { db } = require("../../config/firebase");
const notificationModel = require("./notification.model");
const subscriptionModel = require("./subscription.model"); // MySQL

/**
 * ============================================================
 * KONSTANTA
 * ============================================================
 */
const BUSINESS_CATEGORY_STOCK = 1;
const SUBSCRIPTION_WARNING_DAYS = 7;
const STORES_COLLECTION = "stores";

/**
 * ============================================================
 * CEK APAKAH TOKO MENGGUNAKAN STOCK (FIRESTORE)
 * ============================================================
 */
const isStockBusiness = async (idStore) => {
  if (!idStore) return false;

  try {
    const doc = await db.collection(STORES_COLLECTION).doc(idStore).get();
    if (!doc.exists) return false;
    const data = doc.data();
    return Number(data.id_business_category) === BUSINESS_CATEGORY_STOCK;
  } catch (error) {
    console.error("Error checking stock business:", error);
    return false;
  }
};

/**
 * ============================================================
 * GET STORE BUSINESS CATEGORY (FIRESTORE)
 * ============================================================
 */
const getStoreBusinessCategory = async (idStore) => {
  if (!idStore) return null;

  try {
    const doc = await db.collection(STORES_COLLECTION).doc(idStore).get();
    if (!doc.exists) return null;
    return Number(doc.data().id_business_category);
  } catch (error) {
    console.error("Error getting store business category:", error);
    return null;
  }
};

/**
 * ============================================================
 * CREATE NOTIFICATION (delegasi ke model)
 * ============================================================
 */
const createNotification = async ({
  idUser,
  idStore = null,
  tipe,
  judul,
  pesan,
  referenceType = null,
  referenceId = null,
}) => {
  if (!idUser) throw new Error("idUser wajib diisi");
  if (!tipe) throw new Error("tipe notifikasi wajib diisi");
  if (!judul) throw new Error("judul notifikasi wajib diisi");
  if (!pesan) throw new Error("pesan notifikasi wajib diisi");

  return await notificationModel.create({
    idUser,
    idStore,
    tipe,
    judul,
    pesan,
    referenceType,
    referenceId,
  });
};

/**
 * ============================================================
 * CREATE NOTIFICATION ANTI DUPLICATE
 * ============================================================
 */
const createNotificationIfNotExists = async ({
  idUser,
  idStore = null,
  tipe,
  judul,
  pesan,
  referenceType = null,
  referenceId = null,
}) => {
  if (!idUser) throw new Error("idUser wajib diisi");
  if (!tipe) throw new Error("tipe notifikasi wajib diisi");
  if (!judul) throw new Error("judul notifikasi wajib diisi");
  if (!pesan) throw new Error("pesan notifikasi wajib diisi");

  return await notificationModel.createIfNotExists({
    idUser,
    idStore,
    tipe,
    judul,
    pesan,
    referenceType,
    referenceId,
  });
};

/**
 * ============================================================
 * NOTIFIKASI STOK MENIPIS
 * ============================================================
 */
const notifyStockLow = async ({
  idUser,
  idStore,
  idProduct,
  namaProduk,
  stok,
  stokMinimum,
}) => {
  const stockBusiness = await isStockBusiness(idStore);
  if (!stockBusiness) return null;

  const currentStock = Number(stok);
  const minimumStock = Number(stokMinimum);
  if (isNaN(currentStock) || isNaN(minimumStock)) return null;
  if (currentStock > minimumStock) return null;

  return await createNotification({
    idUser,
    idStore,
    tipe: "stok_menipis",
    judul: "Stok Menipis",
    pesan: `Stok ${namaProduk} tersisa ${currentStock}. Segera lakukan restock.`,
    referenceType: "product",
    referenceId: idProduct,
  });
};

/**
 * ============================================================
 * NOTIFIKASI STOK HABIS
 * ============================================================
 */
const notifyStockEmpty = async ({
  idUser,
  idStore,
  idProduct,
  namaProduk,
  stok,
}) => {
  const stockBusiness = await isStockBusiness(idStore);
  if (!stockBusiness) return null;

  const currentStock = Number(stok);
  if (isNaN(currentStock)) return null;
  if (currentStock > 0) return null;

  return await createNotification({
    idUser,
    idStore,
    tipe: "stok_habis",
    judul: "Stok Habis",
    pesan: `Stok ${namaProduk} sudah habis. Segera lakukan restock.`,
    referenceType: "product",
    referenceId: idProduct,
  });
};

/**
 * ============================================================
 * CEK DAN BUAT NOTIFIKASI STOCK (otomatis)
 * ============================================================
 */
const notifyStock = async ({
  idUser,
  idStore,
  idProduct,
  namaProduk,
  stok,
  stokMinimum,
}) => {
  const stockBusiness = await isStockBusiness(idStore);
  if (!stockBusiness) return null;

  const currentStock = Number(stok);
  const minimumStock = Number(stokMinimum);
  if (isNaN(currentStock) || isNaN(minimumStock)) return null;

  if (currentStock <= 0) {
    return await notifyStockEmpty({
      idUser,
      idStore,
      idProduct,
      namaProduk,
      stok: currentStock,
    });
  }

  if (currentStock <= minimumStock) {
    return await notifyStockLow({
      idUser,
      idStore,
      idProduct,
      namaProduk,
      stok: currentStock,
      stokMinimum: minimumStock,
    });
  }

  return null; // stock aman
};

/**
 * ============================================================
 * NOTIFIKASI PESANAN BARU
 * ============================================================
 */
const notifyNewOrder = async ({
  idUser,
  idStore,
  idTransaction,
  kodeTransaksi,
  namaPelanggan = null,
  grandTotal,
}) => {
  let pesan = `Pesanan ${kodeTransaksi} telah dibuat.`;
  if (namaPelanggan) {
    pesan = `Pesanan ${kodeTransaksi} atas nama ${namaPelanggan} telah dibuat.`;
  }
  if (grandTotal !== undefined && grandTotal !== null) {
    pesan += ` Total Rp${Number(grandTotal).toLocaleString("id-ID")}.`;
  }

  return await createNotification({
    idUser,
    idStore,
    tipe: "pesanan_baru",
    judul: "Pesanan Baru",
    pesan,
    referenceType: "transaction",
    referenceId: idTransaction,
  });
};

/**
 * ============================================================
 * NOTIFIKASI PEMBAYARAN BERHASIL
 * ============================================================
 */
const notifyPaymentSuccess = async ({
  idUser,
  idStore,
  idTransaction,
  kodeTransaksi,
  grandTotal,
}) => {
  const total = Number(grandTotal || 0);
  return await createNotification({
    idUser,
    idStore,
    tipe: "pembayaran_berhasil",
    judul: "Pembayaran Berhasil",
    pesan: `Pembayaran ${kodeTransaksi} sebesar Rp${total.toLocaleString("id-ID")} telah diterima.`,
    referenceType: "transaction",
    referenceId: idTransaction,
  });
};

/**
 * ============================================================
 * NOTIFIKASI PESANAN BELUM BAYAR
 * ============================================================
 */
const notifyUnpaidOrder = async ({
  idUser,
  idStore,
  idTransaction,
  kodeTransaksi,
  namaPelanggan = null,
  grandTotal,
}) => {
  const total = Number(grandTotal || 0);
  let pesan = `Pesanan ${kodeTransaksi} sebesar Rp${total.toLocaleString("id-ID")} belum dibayar.`;
  if (namaPelanggan) {
    pesan = `Pesanan ${kodeTransaksi} atas nama ${namaPelanggan} sebesar Rp${total.toLocaleString("id-ID")} belum dibayar.`;
  }
  return await createNotification({
    idUser,
    idStore,
    tipe: "pesanan_belum_bayar",
    judul: "Pesanan Belum Dibayar",
    pesan,
    referenceType: "transaction",
    referenceId: idTransaction,
  });
};

/**
 * ============================================================
 * NOTIFIKASI TRANSAKSI DIBATALKAN
 * ============================================================
 */
const notifyTransactionCancelled = async ({
  idUser,
  idStore,
  idTransaction,
  kodeTransaksi,
}) => {
  return await createNotification({
    idUser,
    idStore,
    tipe: "transaksi_dibatalkan",
    judul: "Transaksi Dibatalkan",
    pesan: `Transaksi ${kodeTransaksi} telah dibatalkan.`,
    referenceType: "transaction",
    referenceId: idTransaction,
  });
};

/**
 * ============================================================
 * NOTIFIKASI SUBSCRIPTION HAMPIR EXPIRED
 * ============================================================
 */
const notifySubscriptionExpiring = async ({
  idSubscription,
  idOwner,
  kodeInvoice,
  namaPaket,
  tanggalBerakhir,
  daysRemaining,
}) => {
  if (!idSubscription || !idOwner) return null;

  const endDate = new Date(tanggalBerakhir);
  if (isNaN(endDate.getTime())) return null;

  let remaining = Number(daysRemaining);
  if (isNaN(remaining)) {
    const now = new Date();
    remaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  if (remaining <= 0 || remaining > SUBSCRIPTION_WARNING_DAYS) return null;

  const formattedDate = endDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const packageName = namaPaket || "Subscription";

  let pesan = `${packageName} akan berakhir dalam ${remaining} hari pada ${formattedDate}.`;
  if (kodeInvoice) pesan += ` Invoice ${kodeInvoice}.`;

  return await createNotificationIfNotExists({
    idUser: idOwner,
    idStore: null,
    tipe: "subscription_hampir_expired",
    judul: "Subscription Hampir Berakhir",
    pesan,
    referenceType: "subscription",
    referenceId: idSubscription,
  });
};

/**
 * ============================================================
 * NOTIFIKASI SUBSCRIPTION EXPIRED
 * ============================================================
 */
const notifySubscriptionExpired = async ({
  idSubscription,
  idOwner,
  kodeInvoice,
  namaPaket,
  tanggalBerakhir,
}) => {
  if (!idSubscription || !idOwner) return null;

  const endDate = new Date(tanggalBerakhir);
  if (isNaN(endDate.getTime())) return null;
  if (endDate.getTime() > Date.now()) return null;

  const formattedDate = endDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const packageName = namaPaket || "Subscription";

  let pesan = `${packageName} telah berakhir pada ${formattedDate}. Silakan lakukan perpanjangan subscription untuk melanjutkan penggunaan layanan.`;
  if (kodeInvoice) pesan += ` Invoice ${kodeInvoice}.`;

  const notification = await createNotificationIfNotExists({
    idUser: idOwner,
    idStore: null,
    tipe: "subscription_expired",
    judul: "Subscription Telah Berakhir",
    pesan,
    referenceType: "subscription",
    referenceId: idSubscription,
  });

  // Update status subscription menjadi expired via MySQL
  await subscriptionModel.markSubscriptionExpired(idSubscription);

  return notification;
};

/**
 * ============================================================
 * CHECK SUBSCRIPTION OWNER (status)
 * ============================================================
 */
const checkSubscriptionOwner = async ({ idOwner }) => {
  if (!idOwner) {
    return { subscription: null, status: "expired", days_remaining: 0 };
  }

  // Gunakan subscriptionModel (MySQL)
  const subscription = await subscriptionModel.findActiveByOwner(idOwner);
  if (!subscription) {
    return { subscription: null, status: "expired", days_remaining: 0 };
  }

  const endDate = new Date(subscription.tanggal_berakhir);
  const now = new Date();
  const difference = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24));

  if (difference <= 0) {
    return { subscription, status: "expired", days_remaining: 0 };
  }
  if (daysRemaining <= SUBSCRIPTION_WARNING_DAYS) {
    return { subscription, status: "hampir_expired", days_remaining: daysRemaining };
  }
  return { subscription, status: "aktif", days_remaining: daysRemaining };
};

/**
 * ============================================================
 * CHECK SUBSCRIPTION NOTIFICATIONS (untuk semua owner) - CRON
 * ============================================================
 */
const checkSubscriptionNotifications = async () => {
  const result = { expiring: [], expired: [] };

  // Hampir expired - ambil dari MySQL
  const expiringSubscriptions = await subscriptionModel.findSubscriptionsExpiringSoon(SUBSCRIPTION_WARNING_DAYS);
  for (const subscription of expiringSubscriptions) {
    try {
      const notif = await notifySubscriptionExpiring({
        idSubscription: subscription.id_subscription,
        idOwner: subscription.id_owner,
        kodeInvoice: subscription.kode_invoice,
        namaPaket: subscription.nama_paket,
        tanggalBerakhir: subscription.tanggal_berakhir,
      });
      if (notif) result.expiring.push(notif);
    } catch (error) {
      console.error("NOTIFICATION SUBSCRIPTION EXPIRING ERROR:", error);
    }
  }

  // Sudah expired - ambil dari MySQL
  const expiredSubscriptions = await subscriptionModel.findSubscriptionsExpired();
  for (const subscription of expiredSubscriptions) {
    try {
      const notif = await notifySubscriptionExpired({
        idSubscription: subscription.id_subscription,
        idOwner: subscription.id_owner,
        kodeInvoice: subscription.kode_invoice,
        namaPaket: subscription.nama_paket,
        tanggalBerakhir: subscription.tanggal_berakhir,
      });
      if (notif) result.expired.push(notif);
    } catch (error) {
      console.error("NOTIFICATION SUBSCRIPTION EXPIRED ERROR:", error);
    }
  }

  return result;
};

/**
 * ============================================================
 * CHECK SUBSCRIPTION NOTIFICATION FOR ONE OWNER
 * ============================================================
 */
const checkSubscriptionNotificationForOwner = async ({ idOwner }) => {
  if (!idOwner) return { expiring: null, expired: null };

  // Gunakan subscriptionModel (MySQL)
  const subscription = await subscriptionModel.findActiveByOwner(idOwner);
  if (!subscription) return { expiring: null, expired: null };

  const endDate = new Date(subscription.tanggal_berakhir);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (diff <= 0) {
    return {
      expiring: null,
      expired: await notifySubscriptionExpired({
        idSubscription: subscription.id_subscription,
        idOwner: subscription.id_owner,
        kodeInvoice: subscription.kode_invoice,
        namaPaket: subscription.nama_paket,
        tanggalBerakhir: subscription.tanggal_berakhir,
      }),
    };
  }

  if (daysRemaining <= SUBSCRIPTION_WARNING_DAYS) {
    return {
      expiring: await notifySubscriptionExpiring({
        idSubscription: subscription.id_subscription,
        idOwner: subscription.id_owner,
        kodeInvoice: subscription.kode_invoice,
        namaPaket: subscription.nama_paket,
        tanggalBerakhir: subscription.tanggal_berakhir,
        daysRemaining,
      }),
      expired: null,
    };
  }

  return { expiring: null, expired: null };
};

/**
 * ============================================================
 * GET SUBSCRIPTION STATUS (untuk frontend)
 * ============================================================
 */
const getSubscriptionStatus = async ({ idOwner }) => {
  if (!idOwner) {
    return { subscription: null, status: "expired", days_remaining: 0 };
  }
  // Gunakan subscriptionModel (MySQL)
  const subscription = await subscriptionModel.findActiveByOwner(idOwner);
  if (!subscription) {
    return { subscription: null, status: "expired", days_remaining: 0 };
  }

  const endDate = new Date(subscription.tanggal_berakhir);
  const now = new Date();
  const difference = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24));

  if (difference <= 0) {
    return { subscription, status: "expired", days_remaining: 0 };
  }
  if (daysRemaining <= SUBSCRIPTION_WARNING_DAYS) {
    return { subscription, status: "hampir_expired", days_remaining: daysRemaining };
  }
  return { subscription, status: "aktif", days_remaining: daysRemaining };
};

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */
module.exports = {
  BUSINESS_CATEGORY_STOCK,
  isStockBusiness,
  getStoreBusinessCategory,

  createNotification,
  createNotificationIfNotExists,

  notifyStockLow,
  notifyStockEmpty,
  notifyStock,

  notifyNewOrder,
  notifyPaymentSuccess,
  notifyUnpaidOrder,
  notifyTransactionCancelled,

  notifySubscriptionExpiring,
  notifySubscriptionExpired,
  checkSubscriptionOwner,
  checkSubscriptionNotifications,
  checkSubscriptionNotificationForOwner,
  getSubscriptionStatus,

  SUBSCRIPTION_WARNING_DAYS,
};