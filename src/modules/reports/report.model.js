const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| HELPER DATE FILTER
|--------------------------------------------------------------------------
*/
const buildDateFilter = (
  startDate,
  endDate,
  alias = "t"
) => {
  let condition = ""
  const values = []

  if (startDate && endDate) {
    condition = `
      AND DATE(${alias}.created_at)
      BETWEEN ? AND ?
    `

    values.push(
      startDate,
      endDate
    )
  } else if (startDate) {
    condition = `
      AND DATE(${alias}.created_at) >= ?
    `

    values.push(startDate)
  } else if (endDate) {
    condition = `
      AND DATE(${alias}.created_at) <= ?
    `

    values.push(endDate)
  }

  return {
    condition,
    values,
  }
}

/*
|--------------------------------------------------------------------------
| CEK OUTLET MILIK OWNER
|--------------------------------------------------------------------------
|
| Digunakan ketika owner memilih outlet tertentu.
|
| Contoh:
|
| owner = 10
| outlet = 3
|
| Maka hanya boleh jika:
|
| stores.id_store = 3
| AND stores.id_owner = 10
|
|--------------------------------------------------------------------------
*/
const isStoreOwnedByOwner = async (
  id_store,
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store
    FROM stores
    WHERE id_store = ?
      AND id_owner = ?
      AND status_toko = 'aktif'
    LIMIT 1
    `,
    [
      id_store,
      id_owner,
    ]
  )

  return rows.length > 0
}

/*
|--------------------------------------------------------------------------
| SUMMARY BY OWNER
|--------------------------------------------------------------------------
|
| Digunakan jika owner melihat seluruh outlet.
|
|--------------------------------------------------------------------------
*/
const getSummaryByOwner = async (
  id_owner,
  startDate,
  endDate
) => {
  const filter =
    buildDateFilter(
      startDate,
      endDate,
      "t"
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        COUNT(
          t.id_transaction
        ) AS total_transaksi,

        COALESCE(
          SUM(t.total_qty),
          0
        ) AS total_produk_terjual,

        COALESCE(
          SUM(t.subtotal),
          0
        ) AS total_subtotal,

        COALESCE(
          SUM(t.diskon),
          0
        ) AS total_diskon,

        COALESCE(
          SUM(t.pajak),
          0
        ) AS total_pajak,

        COALESCE(
          SUM(t.grand_total),
          0
        ) AS total_pendapatan,

        COALESCE(
          AVG(t.grand_total),
          0
        ) AS rata_rata_transaksi

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store = s.id_store

      WHERE s.id_owner = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        ${filter.condition}
      `,
      [
        id_owner,
        ...filter.values,
      ]
    )

  return rows[0]
}

/*
|--------------------------------------------------------------------------
| SUMMARY BY STORE
|--------------------------------------------------------------------------
|
| Digunakan ketika:
|
| owner memilih outlet
| ATAU
| admin melihat laporan outletnya.
|
|--------------------------------------------------------------------------
*/
const getSummaryByStore = async (
  id_store,
  startDate,
  endDate
) => {
  const filter =
    buildDateFilter(
      startDate,
      endDate,
      "t"
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        COUNT(
          t.id_transaction
        ) AS total_transaksi,

        COALESCE(
          SUM(t.total_qty),
          0
        ) AS total_produk_terjual,

        COALESCE(
          SUM(t.subtotal),
          0
        ) AS total_subtotal,

        COALESCE(
          SUM(t.diskon),
          0
        ) AS total_diskon,

        COALESCE(
          SUM(t.pajak),
          0
        ) AS total_pajak,

        COALESCE(
          SUM(t.grand_total),
          0
        ) AS total_pendapatan,

        COALESCE(
          AVG(t.grand_total),
          0
        ) AS rata_rata_transaksi

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store = s.id_store

      WHERE t.id_store = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        ${filter.condition}
      `,
      [
        id_store,
        ...filter.values,
      ]
    )

  return rows[0]
}

/*
|--------------------------------------------------------------------------
| DAILY REPORT BY OWNER
|--------------------------------------------------------------------------
*/
const getDailyByOwner = async (
  id_owner,
  startDate,
  endDate
) => {
  const filter =
    buildDateFilter(
      startDate,
      endDate,
      "t"
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        DATE(
          t.created_at
        ) AS tanggal,

        COUNT(
          t.id_transaction
        ) AS total_transaksi,

        COALESCE(
          SUM(t.total_qty),
          0
        ) AS total_qty,

        COALESCE(
          SUM(t.grand_total),
          0
        ) AS total_pendapatan

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store = s.id_store

      WHERE s.id_owner = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        ${filter.condition}

      GROUP BY
        DATE(t.created_at)

      ORDER BY
        tanggal ASC
      `,
      [
        id_owner,
        ...filter.values,
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| DAILY REPORT BY STORE
|--------------------------------------------------------------------------
*/
const getDailyByStore = async (
  id_store,
  startDate,
  endDate
) => {
  const filter =
    buildDateFilter(
      startDate,
      endDate,
      "t"
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        DATE(
          t.created_at
        ) AS tanggal,

        COUNT(
          t.id_transaction
        ) AS total_transaksi,

        COALESCE(
          SUM(t.total_qty),
          0
        ) AS total_qty,

        COALESCE(
          SUM(t.grand_total),
          0
        ) AS total_pendapatan

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store = s.id_store

      WHERE t.id_store = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        ${filter.condition}

      GROUP BY
        DATE(t.created_at)

      ORDER BY
        tanggal ASC
      `,
      [
        id_store,
        ...filter.values,
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| MONTHLY REPORT BY OWNER
|--------------------------------------------------------------------------
*/
const getMonthlyByOwner = async (
  id_owner,
  year
) => {
  const [rows] =
    await pool.query(
      `
      SELECT
        DATE_FORMAT(
          t.created_at,
          '%Y-%m'
        ) AS bulan,

        COUNT(
          t.id_transaction
        ) AS total_transaksi,

        COALESCE(
          SUM(t.total_qty),
          0
        ) AS total_qty,

        COALESCE(
          SUM(t.grand_total),
          0
        ) AS total_pendapatan

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store = s.id_store

      WHERE s.id_owner = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        AND YEAR(
          t.created_at
        ) = ?

      GROUP BY
        DATE_FORMAT(
          t.created_at,
          '%Y-%m'
        )

      ORDER BY
        bulan ASC
      `,
      [
        id_owner,
        year,
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| MONTHLY REPORT BY STORE
|--------------------------------------------------------------------------
*/
const getMonthlyByStore = async (
  id_store,
  year
) => {
  const [rows] =
    await pool.query(
      `
      SELECT
        DATE_FORMAT(
          t.created_at,
          '%Y-%m'
        ) AS bulan,

        COUNT(
          t.id_transaction
        ) AS total_transaksi,

        COALESCE(
          SUM(t.total_qty),
          0
        ) AS total_qty,

        COALESCE(
          SUM(t.grand_total),
          0
        ) AS total_pendapatan

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store = s.id_store

      WHERE t.id_store = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        AND YEAR(
          t.created_at
        ) = ?

      GROUP BY
        DATE_FORMAT(
          t.created_at,
          '%Y-%m'
        )

      ORDER BY
        bulan ASC
      `,
      [
        id_store,
        year,
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| TOP PRODUCTS BY OWNER
|--------------------------------------------------------------------------
*/
const getTopProductsByOwner = async (
  id_owner,
  startDate,
  endDate,
  limit = 10
) => {
  const filter =
    buildDateFilter(
      startDate,
      endDate,
      "t"
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        ti.id_product,
        ti.kode_produk,
        ti.nama_produk,

        s.nama_toko,

        COALESCE(
          SUM(ti.qty),
          0
        ) AS total_terjual,

        COALESCE(
          SUM(ti.subtotal),
          0
        ) AS total_pendapatan

      FROM transaction_items ti

      INNER JOIN transactions t
        ON ti.id_transaction =
           t.id_transaction

      INNER JOIN stores s
        ON t.id_store =
           s.id_store

      WHERE s.id_owner = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        ${filter.condition}

      GROUP BY
        ti.id_product,
        ti.kode_produk,
        ti.nama_produk,
        s.nama_toko

      ORDER BY
        total_terjual DESC

      LIMIT ?
      `,
      [
        id_owner,
        ...filter.values,
        Number(limit),
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| TOP PRODUCTS BY STORE
|--------------------------------------------------------------------------
*/
const getTopProductsByStore = async (
  id_store,
  startDate,
  endDate,
  limit = 10
) => {
  const filter =
    buildDateFilter(
      startDate,
      endDate,
      "t"
    )

  const [rows] =
    await pool.query(
      `
      SELECT
        ti.id_product,
        ti.kode_produk,
        ti.nama_produk,

        COALESCE(
          SUM(ti.qty),
          0
        ) AS total_terjual,

        COALESCE(
          SUM(ti.subtotal),
          0
        ) AS total_pendapatan

      FROM transaction_items ti

      INNER JOIN transactions t
        ON ti.id_transaction =
           t.id_transaction

      INNER JOIN stores s
        ON t.id_store =
           s.id_store

      WHERE t.id_store = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

        ${filter.condition}

      GROUP BY
        ti.id_product,
        ti.kode_produk,
        ti.nama_produk

      ORDER BY
        total_terjual DESC

      LIMIT ?
      `,
      [
        id_store,
        ...filter.values,
        Number(limit),
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| RECENT TRANSACTIONS BY OWNER
|--------------------------------------------------------------------------
*/
const getRecentTransactionsByOwner = async (
  id_owner,
  limit = 10
) => {
  const [rows] =
    await pool.query(
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

        t.grand_total,

        t.metode_pembayaran,

        t.jumlah_bayar,
        t.kembalian,

        t.status_transaksi,

        t.created_at

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store =
           s.id_store

      LEFT JOIN users u
        ON t.id_user =
           u.id_user

      WHERE s.id_owner = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

      ORDER BY
        t.id_transaction DESC

      LIMIT ?
      `,
      [
        id_owner,
        Number(limit),
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| RECENT TRANSACTIONS BY STORE
|--------------------------------------------------------------------------
*/
const getRecentTransactionsByStore = async (
  id_store,
  limit = 10
) => {
  const [rows] =
    await pool.query(
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

        t.grand_total,

        t.metode_pembayaran,

        t.jumlah_bayar,
        t.kembalian,

        t.status_transaksi,

        t.created_at

      FROM transactions t

      INNER JOIN stores s
        ON t.id_store =
           s.id_store

      LEFT JOIN users u
        ON t.id_user =
           u.id_user

      WHERE t.id_store = ?

        AND s.status_toko = 'aktif'

        AND t.status_transaksi = 'selesai'

      ORDER BY
        t.id_transaction DESC

      LIMIT ?
      `,
      [
        id_store,
        Number(limit),
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| LOW STOCK PRODUCTS BY OWNER
|--------------------------------------------------------------------------
*/
const getLowStockProductsByOwner = async (
  id_owner
) => {
  const [rows] =
    await pool.query(
      `
      SELECT
        p.id_product,
        p.id_store,

        s.nama_toko,

        p.kode_produk,
        p.nama_produk,

        p.stok,
        p.stok_minimum,

        p.satuan,

        p.status_produk

      FROM products p

      INNER JOIN stores s
        ON p.id_store =
           s.id_store

      WHERE s.id_owner = ?

        AND s.status_toko = 'aktif'

        AND p.track_stock = 'ya'

        AND p.stok <= p.stok_minimum

        AND p.status_produk = 'aktif'

      ORDER BY
        p.stok ASC
      `,
      [
        id_owner,
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| LOW STOCK PRODUCTS BY STORE
|--------------------------------------------------------------------------
*/
const getLowStockProductsByStore = async (
  id_store
) => {
  const [rows] =
    await pool.query(
      `
      SELECT
        p.id_product,
        p.id_store,

        s.nama_toko,

        p.kode_produk,
        p.nama_produk,

        p.stok,
        p.stok_minimum,

        p.satuan,

        p.status_produk

      FROM products p

      INNER JOIN stores s
        ON p.id_store =
           s.id_store

      WHERE p.id_store = ?

        AND s.status_toko = 'aktif'

        AND p.track_stock = 'ya'

        AND p.stok <= p.stok_minimum

        AND p.status_produk = 'aktif'

      ORDER BY
        p.stok ASC
      `,
      [
        id_store,
      ]
    )

  return rows
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/
module.exports = {
  /*
  |----------------------------------------------------------------------
  | STORE ACCESS
  |----------------------------------------------------------------------
  */
  isStoreOwnedByOwner,

  /*
  |----------------------------------------------------------------------
  | SUMMARY
  |----------------------------------------------------------------------
  */
  getSummaryByOwner,
  getSummaryByStore,

  /*
  |----------------------------------------------------------------------
  | DAILY
  |----------------------------------------------------------------------
  */
  getDailyByOwner,
  getDailyByStore,

  /*
  |----------------------------------------------------------------------
  | MONTHLY
  |----------------------------------------------------------------------
  */
  getMonthlyByOwner,
  getMonthlyByStore,

  /*
  |----------------------------------------------------------------------
  | TOP PRODUCTS
  |----------------------------------------------------------------------
  */
  getTopProductsByOwner,
  getTopProductsByStore,

  /*
  |----------------------------------------------------------------------
  | RECENT TRANSACTIONS
  |----------------------------------------------------------------------
  */
  getRecentTransactionsByOwner,
  getRecentTransactionsByStore,

  /*
  |----------------------------------------------------------------------
  | LOW STOCK
  |----------------------------------------------------------------------
  */
  getLowStockProductsByOwner,
  getLowStockProductsByStore,
}