const pool = require("../../config/database");
const notificationModel = require("./notification.model");

/**
 * ============================================================
 * NOTIFICATION SERVICE
 * ============================================================
 *
 * FUNGSI:
 *
 * 1. Notifikasi stok
 * 2. Notifikasi pesanan
 * 3. Notifikasi pembayaran
 * 4. Notifikasi transaksi dibatalkan
 * 5. Notifikasi subscription hampir expired
 * 6. Notifikasi subscription expired
 *
 *
 * ============================================================
 * ATURAN BUSINESS CATEGORY
 * ============================================================
 *
 * id_business_category = 1
 * => Toko / Grosir
 * => MENGGUNAKAN STOCK
 * => BOLEH membuat notifikasi stok
 *
 * id_business_category = 2
 * => Coffee / Kedai
 * => TIDAK menggunakan stock
 * => TIDAK membuat notifikasi stok
 *
 *
 * ============================================================
 * ATURAN SUBSCRIPTION
 * ============================================================
 *
 * Subscription dimiliki oleh OWNER.
 *
 * Hampir expired:
 * tanggal_berakhir <= 7 hari dari sekarang
 *
 * Expired:
 * tanggal_berakhir <= sekarang
 *
 * Notifikasi subscription:
 * id_store = NULL
 *
 * Karena subscription berlaku untuk owner,
 * bukan untuk toko tertentu.
 */


/**
 * ============================================================
 * KONSTANTA
 * ============================================================
 */

/**
 * ID kategori bisnis yang menggunakan stock.
 */
const BUSINESS_CATEGORY_STOCK = 1;


/**
 * Berapa hari sebelum expired
 * notifikasi hampir expired dibuat.
 */
const SUBSCRIPTION_WARNING_DAYS = 7;


/**
 * ============================================================
 * CEK APAKAH TOKO MENGGUNAKAN STOCK
 * ============================================================
 *
 * Hanya:
 *
 * id_business_category = 1
 *
 * yang menggunakan stock.
 */
const isStockBusiness = async (idStore) => {

    if (!idStore) {
        return false;
    }

    const [rows] = await pool.execute(
        `
        SELECT
            id_business_category
        FROM stores
        WHERE id_store = ?
        LIMIT 1
        `,
        [idStore]
    );

    if (rows.length === 0) {
        return false;
    }

    return (
        Number(rows[0].id_business_category) ===
        BUSINESS_CATEGORY_STOCK
    );
};


/**
 * ============================================================
 * GET STORE BUSINESS CATEGORY
 * ============================================================
 */
const getStoreBusinessCategory = async (idStore) => {

    if (!idStore) {
        return null;
    }

    const [rows] = await pool.execute(
        `
        SELECT
            id_business_category
        FROM stores
        WHERE id_store = ?
        LIMIT 1
        `,
        [idStore]
    );

    if (rows.length === 0) {
        return null;
    }

    return Number(
        rows[0].id_business_category
    );
};


/**
 * ============================================================
 * CREATE NOTIFICATION
 * ============================================================
 *
 * Fungsi umum untuk membuat notifikasi.
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

    if (!idUser) {
        throw new Error(
            "idUser wajib diisi"
        );
    }

    if (!tipe) {
        throw new Error(
            "tipe notifikasi wajib diisi"
        );
    }

    if (!judul) {
        throw new Error(
            "judul notifikasi wajib diisi"
        );
    }

    if (!pesan) {
        throw new Error(
            "pesan notifikasi wajib diisi"
        );
    }

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
 *
 * Digunakan khusus untuk notifikasi yang tidak boleh
 * dibuat berkali-kali.
 *
 * Contoh:
 *
 * subscription_hampir_expired
 *
 * subscription ID 10
 *
 * Jika sudah ada:
 *
 * reference_type = subscription
 * reference_id   = 10
 *
 * maka tidak dibuat lagi.
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

    if (!idUser) {
        throw new Error(
            "idUser wajib diisi"
        );
    }

    if (!tipe) {
        throw new Error(
            "tipe notifikasi wajib diisi"
        );
    }

    if (!judul) {
        throw new Error(
            "judul notifikasi wajib diisi"
        );
    }

    if (!pesan) {
        throw new Error(
            "pesan notifikasi wajib diisi"
        );
    }

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
 *
 * Hanya:
 *
 * id_business_category = 1
 *
 * Toko / Grosir.
 */
const notifyStockLow = async ({
    idUser,
    idStore,
    idProduct,
    namaProduk,
    stok,
    stokMinimum,
}) => {

    /**
     * --------------------------------------------------------
     * CEK KATEGORI BISNIS
     * --------------------------------------------------------
     */

    const stockBusiness =
        await isStockBusiness(idStore);

    /**
     * Coffee / Kedai tidak menggunakan stock.
     */
    if (!stockBusiness) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * VALIDASI STOCK
     * --------------------------------------------------------
     */

    const currentStock =
        Number(stok);

    const minimumStock =
        Number(stokMinimum);

    if (
        Number.isNaN(currentStock) ||
        Number.isNaN(minimumStock)
    ) {
        return null;
    }


    /**
     * Jika stock masih di atas minimum,
     * tidak perlu notifikasi.
     */
    if (
        currentStock >
        minimumStock
    ) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * BUAT NOTIFIKASI
     * --------------------------------------------------------
     */

    return await createNotification({
        idUser,
        idStore,

        tipe: "stok_menipis",

        judul: "Stok Menipis",

        pesan:
            `Stok ${namaProduk} tersisa ` +
            `${currentStock}. ` +
            `Segera lakukan restock.`,

        referenceType: "product",
        referenceId: idProduct,
    });
};


/**
 * ============================================================
 * NOTIFIKASI STOK HABIS
 * ============================================================
 *
 * Hanya:
 *
 * id_business_category = 1
 *
 * Toko / Grosir.
 */
const notifyStockEmpty = async ({
    idUser,
    idStore,
    idProduct,
    namaProduk,
    stok,
}) => {

    /**
     * --------------------------------------------------------
     * CEK KATEGORI BISNIS
     * --------------------------------------------------------
     */

    const stockBusiness =
        await isStockBusiness(idStore);

    if (!stockBusiness) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * VALIDASI STOCK
     * --------------------------------------------------------
     */

    const currentStock =
        Number(stok);

    if (
        Number.isNaN(currentStock)
    ) {
        return null;
    }


    /**
     * Hanya jika stock habis.
     */
    if (
        currentStock > 0
    ) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * BUAT NOTIFIKASI
     * --------------------------------------------------------
     */

    return await createNotification({
        idUser,
        idStore,

        tipe: "stok_habis",

        judul: "Stok Habis",

        pesan:
            `Stok ${namaProduk} sudah habis. ` +
            `Segera lakukan restock.`,

        referenceType: "product",
        referenceId: idProduct,
    });
};


/**
 * ============================================================
 * CEK DAN BUAT NOTIFIKASI STOCK
 * ============================================================
 *
 * ATURAN:
 *
 * stock <= 0
 *     => stok_habis
 *
 * stock > 0
 * && stock <= stok_minimum
 *     => stok_menipis
 *
 * stock > stok_minimum
 *     => tidak ada notifikasi
 */
const notifyStock = async ({
    idUser,
    idStore,
    idProduct,
    namaProduk,
    stok,
    stokMinimum,
}) => {

    /**
     * --------------------------------------------------------
     * CEK KATEGORI BISNIS
     * --------------------------------------------------------
     */

    const stockBusiness =
        await isStockBusiness(idStore);

    /**
     * Coffee / Kedai
     * langsung tidak melakukan apa-apa.
     */
    if (!stockBusiness) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * VALIDASI
     * --------------------------------------------------------
     */

    const currentStock =
        Number(stok);

    const minimumStock =
        Number(stokMinimum);

    if (
        Number.isNaN(currentStock) ||
        Number.isNaN(minimumStock)
    ) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * STOCK HABIS
     * --------------------------------------------------------
     */

    if (
        currentStock <= 0
    ) {
        return await notifyStockEmpty({
            idUser,
            idStore,
            idProduct,
            namaProduk,
            stok: currentStock,
        });
    }


    /**
     * --------------------------------------------------------
     * STOCK MENIPIS
     * --------------------------------------------------------
     */

    if (
        currentStock <=
        minimumStock
    ) {
        return await notifyStockLow({
            idUser,
            idStore,
            idProduct,
            namaProduk,
            stok: currentStock,
            stokMinimum: minimumStock,
        });
    }


    /**
     * Stock masih aman.
     */
    return null;
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

    let pesan =
        `Pesanan ${kodeTransaksi} telah dibuat.`;


    if (
        namaPelanggan
    ) {
        pesan =
            `Pesanan ${kodeTransaksi} atas nama ` +
            `${namaPelanggan} telah dibuat.`;
    }


    if (
        grandTotal !== undefined &&
        grandTotal !== null
    ) {
        pesan +=
            ` Total Rp${Number(
                grandTotal
            ).toLocaleString("id-ID")}.`;
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

    const total =
        Number(grandTotal || 0);


    return await createNotification({
        idUser,
        idStore,

        tipe: "pembayaran_berhasil",

        judul: "Pembayaran Berhasil",

        pesan:
            `Pembayaran ${kodeTransaksi} sebesar ` +
            `Rp${total.toLocaleString("id-ID")} ` +
            `telah diterima.`,

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

    const total =
        Number(grandTotal || 0);


    let pesan =
        `Pesanan ${kodeTransaksi} sebesar ` +
        `Rp${total.toLocaleString("id-ID")} ` +
        `belum dibayar.`;


    if (
        namaPelanggan
    ) {
        pesan =
            `Pesanan ${kodeTransaksi} atas nama ` +
            `${namaPelanggan} sebesar ` +
            `Rp${total.toLocaleString("id-ID")} ` +
            `belum dibayar.`;
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

        pesan:
            `Transaksi ${kodeTransaksi} telah dibatalkan.`,

        referenceType: "transaction",
        referenceId: idTransaction,
    });
};


/**
 * ============================================================
 * NOTIFIKASI SUBSCRIPTION HAMPIR EXPIRED
 * ============================================================
 *
 * Default:
 *
 * 7 hari sebelum tanggal_berakhir.
 *
 * Contoh:
 *
 * Hari ini:
 * 17 Agustus
 *
 * Berakhir:
 * 22 Agustus
 *
 * Sisa:
 * 5 hari
 *
 * => buat notifikasi.
 *
 *
 * NOTIFIKASI DIBUAT UNTUK OWNER.
 *
 * id_store = NULL
 */
const notifySubscriptionExpiring = async ({
    idSubscription,
    idOwner,
    kodeInvoice,
    namaPaket,
    tanggalBerakhir,
    daysRemaining,
}) => {

    if (!idSubscription) {
        return null;
    }

    if (!idOwner) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * VALIDASI TANGGAL
     * --------------------------------------------------------
     */

    const endDate =
        new Date(tanggalBerakhir);

    if (
        Number.isNaN(
            endDate.getTime()
        )
    ) {
        return null;
    }


    /**
     * Jika daysRemaining tidak diberikan,
     * hitung dari tanggal berakhir.
     */
    let remaining =
        Number(daysRemaining);


    if (
        Number.isNaN(remaining)
    ) {
        const now =
            new Date();

        const difference =
            endDate.getTime() -
            now.getTime();

        remaining =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );
    }


    /**
     * Jangan membuat notifikasi
     * jika sudah expired.
     */
    if (
        remaining <= 0
    ) {
        return null;
    }


    /**
     * Jangan membuat notifikasi
     * jika masih lebih dari warning days.
     */
    if (
        remaining >
        SUBSCRIPTION_WARNING_DAYS
    ) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * FORMAT TANGGAL
     * --------------------------------------------------------
     */

    const formattedDate =
        endDate.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }
        );


    /**
     * --------------------------------------------------------
     * FORMAT NAMA PAKET
     * --------------------------------------------------------
     */

    const packageName =
        namaPaket ||
        "Subscription";


    /**
     * --------------------------------------------------------
     * PESAN
     * --------------------------------------------------------
     */

    let pesan =
        `${packageName} akan berakhir ` +
        `dalam ${remaining} hari ` +
        `pada ${formattedDate}.`;

    if (
        kodeInvoice
    ) {
        pesan +=
            ` Invoice ${kodeInvoice}.`;
    }


    /**
     * --------------------------------------------------------
     * CREATE ANTI DUPLICATE
     * --------------------------------------------------------
     */

    return await createNotificationIfNotExists({
        idUser: idOwner,

        /**
         * Subscription adalah milik owner,
         * bukan toko.
         */
        idStore: null,

        tipe:
            "subscription_hampir_expired",

        judul:
            "Subscription Hampir Berakhir",

        pesan,

        referenceType:
            "subscription",

        referenceId:
            idSubscription,
    });
};


/**
 * ============================================================
 * NOTIFIKASI SUBSCRIPTION EXPIRED
 * ============================================================
 *
 * Dibuat ketika:
 *
 * tanggal_berakhir <= NOW()
 *
 * Penerima:
 * OWNER
 *
 * id_store:
 * NULL
 */
const notifySubscriptionExpired = async ({
    idSubscription,
    idOwner,
    kodeInvoice,
    namaPaket,
    tanggalBerakhir,
}) => {

    if (!idSubscription) {
        return null;
    }

    if (!idOwner) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * VALIDASI TANGGAL
     * --------------------------------------------------------
     */

    const endDate =
        new Date(tanggalBerakhir);

    if (
        Number.isNaN(
            endDate.getTime()
        )
    ) {
        return null;
    }


    /**
     * Jika belum expired,
     * jangan membuat notifikasi.
     */
    if (
        endDate.getTime() >
        Date.now()
    ) {
        return null;
    }


    /**
     * --------------------------------------------------------
     * FORMAT TANGGAL
     * --------------------------------------------------------
     */

    const formattedDate =
        endDate.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }
        );


    /**
     * --------------------------------------------------------
     * FORMAT NAMA PAKET
     * --------------------------------------------------------
     */

    const packageName =
        namaPaket ||
        "Subscription";


    /**
     * --------------------------------------------------------
     * PESAN
     * --------------------------------------------------------
     */

    let pesan =
        `${packageName} telah berakhir ` +
        `pada ${formattedDate}. ` +
        `Silakan lakukan perpanjangan ` +
        `subscription untuk melanjutkan penggunaan layanan.`;

    if (
        kodeInvoice
    ) {
        pesan +=
            ` Invoice ${kodeInvoice}.`;
    }


    /**
     * --------------------------------------------------------
     * CREATE ANTI DUPLICATE
     * --------------------------------------------------------
     */

    const notification =
        await createNotificationIfNotExists({
            idUser: idOwner,

            /**
             * Subscription global untuk owner.
             */
            idStore: null,

            tipe:
                "subscription_expired",

            judul:
                "Subscription Telah Berakhir",

            pesan,

            referenceType:
                "subscription",

            referenceId:
                idSubscription,
        });


    /**
     * --------------------------------------------------------
     * UPDATE STATUS SUBSCRIPTION
     * --------------------------------------------------------
     *
     * Hanya ubah:
     *
     * aktif → expired
     *
     * jika tanggal memang sudah lewat.
     */
    await notificationModel.markSubscriptionExpired({
        idSubscription,
    });


    return notification;
};


/**
 * ============================================================
 * CHECK SUBSCRIPTION OWNER
 * ============================================================
 *
 * Mengecek subscription aktif milik owner.
 *
 * Return:
 *
 * {
 *   subscription,
 *   status,
 *   days_remaining
 * }
 *
 *
 * Status:
 *
 * aktif
 * hampir_expired
 * expired
 */
const checkSubscriptionOwner = async ({
    idOwner,
}) => {

    if (!idOwner) {
        return {
            subscription: null,
            status: "expired",
            days_remaining: 0,
        };
    }


    const result =
        await notificationModel.getSubscriptionStatus({
            idOwner,
        });


    return result;
};


/**
 * ============================================================
 * CHECK SUBSCRIPTION NOTIFICATIONS
 * ============================================================
 *
 * Fungsi utama untuk:
 *
 * 1. Mencari subscription yang hampir expired
 * 2. Membuat notifikasi hampir expired
 * 3. Mencari subscription yang sudah expired
 * 4. Membuat notifikasi expired
 * 5. Mengubah status subscription menjadi expired
 *
 *
 * Fungsi ini bisa dipanggil:
 *
 * - Saat owner membuka dashboard
 * - Saat owner membuka halaman subscription
 * - Saat login
 * - Melalui cron job
 * - Melalui scheduler
 */
const checkSubscriptionNotifications = async () => {

    const result = {
        expiring: [],
        expired: [],
    };


    /**
     * ========================================================
     * 1. SUBSCRIPTION HAMPIR EXPIRED
     * ========================================================
     */

    const expiringSubscriptions =
        await notificationModel.findSubscriptionsExpiring({
            days:
                SUBSCRIPTION_WARNING_DAYS,
        });


    for (
        const subscription
        of expiringSubscriptions
    ) {

        try {

            const notification =
                await notifySubscriptionExpiring({
                    idSubscription:
                        subscription.id_subscription,

                    idOwner:
                        subscription.id_owner,

                    kodeInvoice:
                        subscription.kode_invoice,

                    namaPaket:
                        subscription.nama_paket,

                    tanggalBerakhir:
                        subscription.tanggal_berakhir,

                    daysRemaining:
                        undefined,
                });


            if (
                notification
            ) {
                result.expiring.push(
                    notification
                );
            }

        } catch (error) {

            console.error(
                "NOTIFICATION SUBSCRIPTION EXPIRING ERROR:",
                error
            );
        }
    }


    /**
     * ========================================================
     * 2. SUBSCRIPTION EXPIRED
     * ========================================================
     */

    const expiredSubscriptions =
        await notificationModel.findExpiredSubscriptions();


    for (
        const subscription
        of expiredSubscriptions
    ) {

        try {

            const notification =
                await notifySubscriptionExpired({
                    idSubscription:
                        subscription.id_subscription,

                    idOwner:
                        subscription.id_owner,

                    kodeInvoice:
                        subscription.kode_invoice,

                    namaPaket:
                        subscription.nama_paket,

                    tanggalBerakhir:
                        subscription.tanggal_berakhir,
                });


            if (
                notification
            ) {
                result.expired.push(
                    notification
                );
            }

        } catch (error) {

            console.error(
                "NOTIFICATION SUBSCRIPTION EXPIRED ERROR:",
                error
            );
        }
    }


    return result;
};


/**
 * ============================================================
 * CHECK SUBSCRIPTION NOTIFICATION FOR ONE OWNER
 * ============================================================
 *
 * Lebih ringan dibanding checkSubscriptionNotifications().
 *
 * Cocok dipanggil saat owner login/dashboard.
 */
const checkSubscriptionNotificationForOwner = async ({
    idOwner,
}) => {

    if (!idOwner) {
        return {
            expiring: null,
            expired: null,
        };
    }


    /**
     * Ambil subscription aktif owner.
     */
    const subscription =
        await notificationModel.findActiveSubscriptionByOwner({
            idOwner,
        });


    /**
     * Jika tidak ada subscription aktif,
     * tidak membuat notifikasi.
     */
    if (!subscription) {
        return {
            expiring: null,
            expired: null,
        };
    }


    /**
     * --------------------------------------------------------
     * HITUNG SISA WAKTU
     * --------------------------------------------------------
     */

    const endDate =
        new Date(
            subscription.tanggal_berakhir
        );

    const now =
        new Date();

    const difference =
        endDate.getTime() -
        now.getTime();

    const daysRemaining =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    /**
     * --------------------------------------------------------
     * EXPIRED
     * --------------------------------------------------------
     */

    if (
        difference <= 0
    ) {

        return {
            expiring: null,

            expired:
                await notifySubscriptionExpired({
                    idSubscription:
                        subscription.id_subscription,

                    idOwner:
                        subscription.id_owner,

                    kodeInvoice:
                        subscription.kode_invoice,

                    namaPaket:
                        subscription.nama_paket,

                    tanggalBerakhir:
                        subscription.tanggal_berakhir,
                }),
        };
    }


    /**
     * --------------------------------------------------------
     * HAMPIR EXPIRED
     * --------------------------------------------------------
     */

    if (
        daysRemaining <=
        SUBSCRIPTION_WARNING_DAYS
    ) {

        return {
            expiring:
                await notifySubscriptionExpiring({
                    idSubscription:
                        subscription.id_subscription,

                    idOwner:
                        subscription.id_owner,

                    kodeInvoice:
                        subscription.kode_invoice,

                    namaPaket:
                        subscription.nama_paket,

                    tanggalBerakhir:
                        subscription.tanggal_berakhir,

                    daysRemaining,
                }),

            expired: null,
        };
    }


    /**
     * --------------------------------------------------------
     * MASIH AMAN
     * --------------------------------------------------------
     */

    return {
        expiring: null,
        expired: null,
    };
};


/**
 * ============================================================
 * GET SUBSCRIPTION STATUS OWNER
 * ============================================================
 *
 * Digunakan frontend untuk mengetahui:
 *
 * - aktif
 * - hampir_expired
 * - expired
 *
 * beserta:
 *
 * - nama paket
 * - tanggal berakhir
 * - jumlah hari tersisa
 */
const getSubscriptionStatus = async ({
    idOwner,
}) => {

    if (!idOwner) {
        return {
            subscription: null,
            status: "expired",
            days_remaining: 0,
        };
    }


    return await notificationModel.getSubscriptionStatus({
        idOwner,
    });
};


/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = {

    /**
     * Business category
     */
    BUSINESS_CATEGORY_STOCK,

    isStockBusiness,
    getStoreBusinessCategory,


    /**
     * General notification
     */
    createNotification,
    createNotificationIfNotExists,


    /**
     * Stock
     */
    notifyStockLow,
    notifyStockEmpty,
    notifyStock,


    /**
     * Transaction
     */
    notifyNewOrder,
    notifyPaymentSuccess,
    notifyUnpaidOrder,
    notifyTransactionCancelled,


    /**
     * Subscription
     */
    notifySubscriptionExpiring,
    notifySubscriptionExpired,

    checkSubscriptionOwner,
    checkSubscriptionNotifications,
    checkSubscriptionNotificationForOwner,

    getSubscriptionStatus,

    /**
     * Constant
     */
    SUBSCRIPTION_WARNING_DAYS,
};