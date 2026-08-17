const pool = require("../../config/database");
const notificationModel = require("./notification.model");

/**
 * ============================================================
 * NOTIFICATION SERVICE
 * ============================================================
 *
 * ATURAN STOCK:
 *
 * id_business_category = 1
 * => Toko / Grosir
 * => MENGGUNAKAN STOCK
 * => BOLEH membuat notifikasi stok
 *
 * id_business_category = 2
 * => Coffee / Kedai
 * => TIDAK menggunakan stock
 * => TIDAK BOLEH membuat notifikasi stok
 */


/**
 * ============================================================
 * KONSTANTA KATEGORI BISNIS
 * ============================================================
 */

const BUSINESS_CATEGORY_STOCK = 1;


/**
 * ============================================================
 * CEK APAKAH TOKO MENGGUNAKAN STOCK
 * ============================================================
 *
 * Hanya kategori bisnis ID 1 yang menggunakan stock.
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

    return Number(rows[0].id_business_category) === BUSINESS_CATEGORY_STOCK;
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

    return Number(rows[0].id_business_category);
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
        throw new Error("idUser wajib diisi");
    }

    if (!tipe) {
        throw new Error("tipe notifikasi wajib diisi");
    }

    if (!judul) {
        throw new Error("judul notifikasi wajib diisi");
    }

    if (!pesan) {
        throw new Error("pesan notifikasi wajib diisi");
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
 * NOTIFIKASI STOK MENIPIS
 * ============================================================
 *
 * Hanya berlaku untuk:
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
    const stockBusiness = await isStockBusiness(idStore);

    /**
     * Coffee / Kedai tidak menggunakan stock.
     *
     * Jangan membuat notifikasi.
     */
    if (!stockBusiness) {
        return null;
    }

    /**
     * --------------------------------------------------------
     * VALIDASI STOCK
     * --------------------------------------------------------
     */
    const currentStock = Number(stok);
    const minimumStock = Number(stokMinimum);

    if (
        Number.isNaN(currentStock) ||
        Number.isNaN(minimumStock)
    ) {
        return null;
    }

    /**
     * Kalau stock belum mencapai batas minimum,
     * tidak perlu notifikasi.
     */
    if (currentStock > minimumStock) {
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
            `Stok ${namaProduk} tersisa ${currentStock}. ` +
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
 * Hanya berlaku untuk:
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
    const stockBusiness = await isStockBusiness(idStore);

    /**
     * Coffee / Kedai tidak menggunakan stock.
     */
    if (!stockBusiness) {
        return null;
    }

    /**
     * --------------------------------------------------------
     * CEK STOCK
     * --------------------------------------------------------
     */
    const currentStock = Number(stok);

    if (Number.isNaN(currentStock)) {
        return null;
    }

    /**
     * Hanya membuat notifikasi jika stock <= 0.
     */
    if (currentStock > 0) {
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
 * Fungsi ini bisa dipanggil setelah stock berubah.
 *
 * Aturan:
 *
 * stock <= 0
 *     => stok_habis
 *
 * stock > 0 && stock <= stok_minimum
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
    const stockBusiness = await isStockBusiness(idStore);

    if (!stockBusiness) {
        return null;
    }

    const currentStock = Number(stok);
    const minimumStock = Number(stokMinimum);

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
    if (currentStock <= 0) {
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

    let pesan = `Pesanan ${kodeTransaksi} telah dibuat.`;

    if (namaPelanggan) {
        pesan =
            `Pesanan ${kodeTransaksi} atas nama ` +
            `${namaPelanggan} telah dibuat.`;
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

        pesan:
            `Pembayaran ${kodeTransaksi} sebesar ` +
            `Rp${total.toLocaleString("id-ID")} telah diterima.`,

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

    let pesan =
        `Pesanan ${kodeTransaksi} sebesar ` +
        `Rp${total.toLocaleString("id-ID")} belum dibayar.`;

    if (namaPelanggan) {
        pesan =
            `Pesanan ${kodeTransaksi} atas nama ` +
            `${namaPelanggan} sebesar ` +
            `Rp${total.toLocaleString("id-ID")} belum dibayar.`;
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
 * EXPORT
 * ============================================================
 */
module.exports = {
    BUSINESS_CATEGORY_STOCK,

    isStockBusiness,
    getStoreBusinessCategory,

    createNotification,

    notifyStockLow,
    notifyStockEmpty,
    notifyStock,

    notifyNewOrder,
    notifyPaymentSuccess,
    notifyUnpaidOrder,
    notifyTransactionCancelled,
};