const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| OWNER DASHBOARD SUMMARY
|--------------------------------------------------------------------------
*/
const getOwnerSummary = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      (
        SELECT COUNT(*)
        FROM stores s
        WHERE s.id_owner = ?
      ) AS total_toko,

      (
        SELECT COUNT(*)
        FROM users u
        LEFT JOIN stores s ON u.id_store = s.id_store
        WHERE u.id_user = ?
           OR s.id_owner = ?
      ) AS total_user,

      (
        SELECT COUNT(*)
        FROM categories c
        JOIN stores s ON c.id_store = s.id_store
        WHERE s.id_owner = ?
      ) AS total_kategori,

      (
        SELECT COUNT(*)
        FROM discounts d
        JOIN stores s ON d.id_store = s.id_store
        WHERE s.id_owner = ?
      ) AS total_diskon,

      (
        SELECT COUNT(*)
        FROM discounts d
        JOIN stores s ON d.id_store = s.id_store
        WHERE s.id_owner = ?
          AND d.status_diskon = 'aktif'
      ) AS total_diskon_aktif,

      (
        SELECT COUNT(*)
        FROM products p
        JOIN stores s ON p.id_store = s.id_store
        WHERE s.id_owner = ?
      ) AS total_produk,

      (
        SELECT COUNT(*)
        FROM products p
        JOIN stores s ON p.id_store = s.id_store
        WHERE s.id_owner = ?
          AND p.status_produk = 'aktif'
      ) AS total_produk_aktif,

      (
        SELECT COUNT(*)
        FROM products p
        JOIN stores s ON p.id_store = s.id_store
        WHERE s.id_owner = ?
          AND p.id_discount IS NOT NULL
      ) AS total_produk_diskon,

      (
        SELECT COUNT(*)
        FROM products p
        JOIN stores s ON p.id_store = s.id_store
        WHERE s.id_owner = ?
          AND p.status_produk = 'aktif'
          AND p.stok <= p.stok_minimum
      ) AS total_stok_menipis,

      (
        SELECT COUNT(*)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS transaksi_hari_ini,

      (
        SELECT COALESCE(SUM(t.subtotal), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_subtotal_hari_ini,

      (
        SELECT COALESCE(SUM(t.diskon), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_diskon_hari_ini,

      (
        SELECT COALESCE(SUM(t.pajak), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_pajak_hari_ini,

      (
        SELECT COALESCE(SUM(t.grand_total), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS pendapatan_hari_ini,

      (
        SELECT COUNT(*)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS transaksi_bulan_ini,

      (
        SELECT COALESCE(SUM(t.subtotal), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS total_subtotal_bulan_ini,

      (
        SELECT COALESCE(SUM(t.diskon), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS total_diskon_bulan_ini,

      (
        SELECT COALESCE(SUM(t.pajak), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS total_pajak_bulan_ini,

      (
        SELECT COALESCE(SUM(t.grand_total), 0)
        FROM transactions t
        JOIN stores s ON t.id_store = s.id_store
        WHERE s.id_owner = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS pendapatan_bulan_ini
    `,
    [
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner,
      id_owner
    ]
  )

  return rows[0]
}

/*
|--------------------------------------------------------------------------
| STORE DASHBOARD SUMMARY
|--------------------------------------------------------------------------
| Untuk admin dan kasir berdasarkan id_store.
|--------------------------------------------------------------------------
*/
const getStoreSummary = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      (
        SELECT COUNT(*)
        FROM users u
        WHERE u.id_store = ?
      ) AS total_user,

      (
        SELECT COUNT(*)
        FROM categories c
        WHERE c.id_store = ?
      ) AS total_kategori,

      (
        SELECT COUNT(*)
        FROM discounts d
        WHERE d.id_store = ?
      ) AS total_diskon,

      (
        SELECT COUNT(*)
        FROM discounts d
        WHERE d.id_store = ?
          AND d.status_diskon = 'aktif'
      ) AS total_diskon_aktif,

      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.id_store = ?
      ) AS total_produk,

      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.id_store = ?
          AND p.status_produk = 'aktif'
      ) AS total_produk_aktif,

      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.id_store = ?
          AND p.id_discount IS NOT NULL
      ) AS total_produk_diskon,

      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.id_store = ?
          AND p.status_produk = 'aktif'
          AND p.stok <= p.stok_minimum
      ) AS total_stok_menipis,

      (
        SELECT COUNT(*)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS transaksi_hari_ini,

      (
        SELECT COALESCE(SUM(t.subtotal), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_subtotal_hari_ini,

      (
        SELECT COALESCE(SUM(t.diskon), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_diskon_hari_ini,

      (
        SELECT COALESCE(SUM(t.pajak), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_pajak_hari_ini,

      (
        SELECT COALESCE(SUM(t.grand_total), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS pendapatan_hari_ini,

      (
        SELECT COUNT(*)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS transaksi_bulan_ini,

      (
        SELECT COALESCE(SUM(t.subtotal), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS total_subtotal_bulan_ini,

      (
        SELECT COALESCE(SUM(t.diskon), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS total_diskon_bulan_ini,

      (
        SELECT COALESCE(SUM(t.pajak), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS total_pajak_bulan_ini,

      (
        SELECT COALESCE(SUM(t.grand_total), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.status_transaksi = 'selesai'
          AND MONTH(t.created_at) = MONTH(CURDATE())
          AND YEAR(t.created_at) = YEAR(CURDATE())
      ) AS pendapatan_bulan_ini
    `,
    [
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store,
      id_store
    ]
  )

  return rows[0]
}

/*
|--------------------------------------------------------------------------
| CASHIER DASHBOARD SUMMARY
|--------------------------------------------------------------------------
| Ringkasan khusus transaksi kasir login hari ini.
|--------------------------------------------------------------------------
*/
const getCashierSummary = async (id_store, id_user) => {
  const [rows] = await pool.query(
    `
    SELECT
      (
        SELECT COUNT(*)
        FROM products p
        WHERE p.id_store = ?
          AND p.status_produk = 'aktif'
      ) AS total_produk_aktif,

      (
        SELECT COUNT(*)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.id_user = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS transaksi_saya_hari_ini,

      (
        SELECT COALESCE(SUM(t.subtotal), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.id_user = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_subtotal_saya_hari_ini,

      (
        SELECT COALESCE(SUM(t.diskon), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.id_user = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_diskon_saya_hari_ini,

      (
        SELECT COALESCE(SUM(t.pajak), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.id_user = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS total_pajak_saya_hari_ini,

      (
        SELECT COALESCE(SUM(t.grand_total), 0)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.id_user = ?
          AND t.status_transaksi = 'selesai'
          AND DATE(t.created_at) = CURDATE()
      ) AS pendapatan_saya_hari_ini,

      (
        SELECT COUNT(*)
        FROM transactions t
        WHERE t.id_store = ?
          AND t.id_user = ?
          AND t.status_transaksi = 'dibatalkan'
          AND DATE(t.created_at) = CURDATE()
      ) AS transaksi_saya_batal_hari_ini
    `,
    [
      id_store,
      id_store,
      id_user,
      id_store,
      id_user,
      id_store,
      id_user,
      id_store,
      id_user,
      id_store,
      id_user,
      id_store,
      id_user
    ]
  )

  return rows[0]
}

/*
|--------------------------------------------------------------------------
| OWNER TOP PRODUCTS
|--------------------------------------------------------------------------
*/
const getOwnerTopProducts = async (id_owner, limit = 5) => {
  const [rows] = await pool.query(
    `
    SELECT
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk,
      s.nama_toko,
      COALESCE(SUM(ti.qty), 0) AS total_terjual,
      COALESCE(SUM(ti.subtotal), 0) AS total_pendapatan,
      COALESCE(SUM(ti.diskon), 0) AS total_diskon
    FROM transaction_items ti
    JOIN transactions t ON ti.id_transaction = t.id_transaction
    JOIN stores s ON t.id_store = s.id_store
    WHERE s.id_owner = ?
      AND t.status_transaksi = 'selesai'
      AND MONTH(t.created_at) = MONTH(CURDATE())
      AND YEAR(t.created_at) = YEAR(CURDATE())
    GROUP BY
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk,
      s.nama_toko
    ORDER BY total_terjual DESC
    LIMIT ?
    `,
    [id_owner, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| STORE TOP PRODUCTS
|--------------------------------------------------------------------------
*/
const getStoreTopProducts = async (id_store, limit = 5) => {
  const [rows] = await pool.query(
    `
    SELECT
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk,
      COALESCE(SUM(ti.qty), 0) AS total_terjual,
      COALESCE(SUM(ti.subtotal), 0) AS total_pendapatan,
      COALESCE(SUM(ti.diskon), 0) AS total_diskon
    FROM transaction_items ti
    JOIN transactions t ON ti.id_transaction = t.id_transaction
    WHERE t.id_store = ?
      AND t.status_transaksi = 'selesai'
      AND MONTH(t.created_at) = MONTH(CURDATE())
      AND YEAR(t.created_at) = YEAR(CURDATE())
    GROUP BY
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk
    ORDER BY total_terjual DESC
    LIMIT ?
    `,
    [id_store, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| OWNER RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getOwnerRecentTransactions = async (id_owner, limit = 5) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.nama_toko,
      t.id_user,
      u.nama_lengkap AS nama_kasir,
      t.kode_transaksi,
      t.total_item,
      t.total_qty,
      t.subtotal,
      t.diskon,
      t.pajak,
      t.ppn_persen,
      t.grand_total,
      t.metode_pembayaran,
      t.status_transaksi,
      t.created_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE s.id_owner = ?
    ORDER BY t.id_transaction DESC
    LIMIT ?
    `,
    [id_owner, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| STORE RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getStoreRecentTransactions = async (id_store, limit = 5) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.nama_toko,
      t.id_user,
      u.nama_lengkap AS nama_kasir,
      t.kode_transaksi,
      t.total_item,
      t.total_qty,
      t.subtotal,
      t.diskon,
      t.pajak,
      t.ppn_persen,
      t.grand_total,
      t.metode_pembayaran,
      t.status_transaksi,
      t.created_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE t.id_store = ?
    ORDER BY t.id_transaction DESC
    LIMIT ?
    `,
    [id_store, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| CASHIER RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getCashierRecentTransactions = async (id_store, id_user, limit = 5) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.nama_toko,
      t.id_user,
      u.nama_lengkap AS nama_kasir,
      t.kode_transaksi,
      t.total_item,
      t.total_qty,
      t.subtotal,
      t.diskon,
      t.pajak,
      t.ppn_persen,
      t.grand_total,
      t.metode_pembayaran,
      t.status_transaksi,
      t.created_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE t.id_store = ?
      AND t.id_user = ?
    ORDER BY t.id_transaction DESC
    LIMIT ?
    `,
    [id_store, id_user, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| OWNER LOW STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
const getOwnerLowStockProducts = async (id_owner, limit = 10) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_product,
      p.id_store,
      s.nama_toko,
      p.kode_produk,
      p.nama_produk,
      p.stok,
      p.stok_minimum,
      p.satuan
    FROM products p
    JOIN stores s ON p.id_store = s.id_store
    WHERE s.id_owner = ?
      AND p.status_produk = 'aktif'
      AND p.stok <= p.stok_minimum
    ORDER BY p.stok ASC
    LIMIT ?
    `,
    [id_owner, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| STORE LOW STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
const getStoreLowStockProducts = async (id_store, limit = 10) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_product,
      p.id_store,
      s.nama_toko,
      p.kode_produk,
      p.nama_produk,
      p.stok,
      p.stok_minimum,
      p.satuan
    FROM products p
    JOIN stores s ON p.id_store = s.id_store
    WHERE p.id_store = ?
      AND p.status_produk = 'aktif'
      AND p.stok <= p.stok_minimum
    ORDER BY p.stok ASC
    LIMIT ?
    `,
    [id_store, Number(limit)]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| OWNER SALES CHART DAILY
|--------------------------------------------------------------------------
| Grafik penjualan 7 hari terakhir.
|--------------------------------------------------------------------------
*/
const getOwnerSalesChart = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      DATE(t.created_at) AS tanggal,
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.subtotal), 0) AS total_subtotal,
      COALESCE(SUM(t.diskon), 0) AS total_diskon,
      COALESCE(SUM(t.pajak), 0) AS total_pajak,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    WHERE s.id_owner = ?
      AND t.status_transaksi = 'selesai'
      AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(t.created_at)
    ORDER BY tanggal ASC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| STORE SALES CHART DAILY
|--------------------------------------------------------------------------
*/
const getStoreSalesChart = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      DATE(t.created_at) AS tanggal,
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.subtotal), 0) AS total_subtotal,
      COALESCE(SUM(t.diskon), 0) AS total_diskon,
      COALESCE(SUM(t.pajak), 0) AS total_pajak,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan
    FROM transactions t
    WHERE t.id_store = ?
      AND t.status_transaksi = 'selesai'
      AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(t.created_at)
    ORDER BY tanggal ASC
    `,
    [id_store]
  )

  return rows
}

module.exports = {
  getOwnerSummary,
  getStoreSummary,
  getCashierSummary,
  getOwnerTopProducts,
  getStoreTopProducts,
  getOwnerRecentTransactions,
  getStoreRecentTransactions,
  getCashierRecentTransactions,
  getOwnerLowStockProducts,
  getStoreLowStockProducts,
  getOwnerSalesChart,
  getStoreSalesChart
}