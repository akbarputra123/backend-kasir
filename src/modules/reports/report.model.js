const pool = require("../../config/database");

/*
|--------------------------------------------------------------------------
| HELPER DATE FILTER
|--------------------------------------------------------------------------
*/
const buildDateFilter = (startDate, endDate, alias = "t") => {
  let condition = "";
  const values = [];

  if (startDate && endDate) {
    condition = ` AND DATE(${alias}.created_at) BETWEEN ? AND ? `;
    values.push(startDate, endDate);
  } else if (startDate) {
    condition = ` AND DATE(${alias}.created_at) >= ? `;
    values.push(startDate);
  } else if (endDate) {
    condition = ` AND DATE(${alias}.created_at) <= ? `;
    values.push(endDate);
  }

  return { condition, values };
};

/*
|--------------------------------------------------------------------------
| SUMMARY BY OWNER (dengan filter toko opsional)
|--------------------------------------------------------------------------
*/
const getSummaryByOwner = async (id_owner, startDate, endDate, id_store = null) => {
  const filter = buildDateFilter(startDate, endDate, "t");
  let storeCondition = "";
  let params = [id_owner];

  if (id_store) {
    storeCondition = " AND s.id_store = ? ";
    params.push(id_store);
  }
  params.push(...filter.values);

  const [rows] = await pool.query(
    `
    SELECT
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.total_qty), 0) AS total_produk_terjual,
      COALESCE(SUM(t.subtotal), 0) AS total_subtotal,
      COALESCE(SUM(t.diskon), 0) AS total_diskon,
      COALESCE(SUM(t.pajak), 0) AS total_pajak,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan,
      COALESCE(AVG(t.grand_total), 0) AS rata_rata_transaksi
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    WHERE s.id_owner = ?
      AND t.status_transaksi = 'selesai'
      ${storeCondition}
      ${filter.condition}
    `,
    params
  );

  return rows[0];
};

/*
|--------------------------------------------------------------------------
| SUMMARY BY STORE (tetap)
|--------------------------------------------------------------------------
*/
const getSummaryByStore = async (id_store, startDate, endDate) => {
  const filter = buildDateFilter(startDate, endDate, "t");

  const [rows] = await pool.query(
    `
    SELECT
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.total_qty), 0) AS total_produk_terjual,
      COALESCE(SUM(t.subtotal), 0) AS total_subtotal,
      COALESCE(SUM(t.diskon), 0) AS total_diskon,
      COALESCE(SUM(t.pajak), 0) AS total_pajak,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan,
      COALESCE(AVG(t.grand_total), 0) AS rata_rata_transaksi
    FROM transactions t
    WHERE t.id_store = ?
      AND t.status_transaksi = 'selesai'
      ${filter.condition}
    `,
    [id_store, ...filter.values]
  );

  return rows[0];
};

/*
|--------------------------------------------------------------------------
| DAILY REPORT BY OWNER (dengan filter toko opsional)
|--------------------------------------------------------------------------
*/
const getDailyByOwner = async (id_owner, startDate, endDate, id_store = null) => {
  const filter = buildDateFilter(startDate, endDate, "t");
  let storeCondition = "";
  let params = [id_owner];

  if (id_store) {
    storeCondition = " AND s.id_store = ? ";
    params.push(id_store);
  }
  params.push(...filter.values);

  const [rows] = await pool.query(
    `
    SELECT
      DATE(t.created_at) AS tanggal,
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.total_qty), 0) AS total_qty,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    WHERE s.id_owner = ?
      AND t.status_transaksi = 'selesai'
      ${storeCondition}
      ${filter.condition}
    GROUP BY DATE(t.created_at)
    ORDER BY tanggal DESC
    `,
    params
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| DAILY REPORT BY STORE (tetap)
|--------------------------------------------------------------------------
*/
const getDailyByStore = async (id_store, startDate, endDate) => {
  const filter = buildDateFilter(startDate, endDate, "t");

  const [rows] = await pool.query(
    `
    SELECT
      DATE(t.created_at) AS tanggal,
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.total_qty), 0) AS total_qty,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan
    FROM transactions t
    WHERE t.id_store = ?
      AND t.status_transaksi = 'selesai'
      ${filter.condition}
    GROUP BY DATE(t.created_at)
    ORDER BY tanggal DESC
    `,
    [id_store, ...filter.values]
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| MONTHLY REPORT BY OWNER (dengan filter toko opsional)
|--------------------------------------------------------------------------
*/
const getMonthlyByOwner = async (id_owner, year, id_store = null) => {
  let storeCondition = "";
  let params = [id_owner, year];

  if (id_store) {
    storeCondition = " AND s.id_store = ? ";
    params.splice(1, 0, id_store); // sisipkan setelah id_owner, sebelum year
  }

  const [rows] = await pool.query(
    `
    SELECT
      DATE_FORMAT(t.created_at, '%Y-%m') AS bulan,
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.total_qty), 0) AS total_qty,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    WHERE s.id_owner = ?
      AND t.status_transaksi = 'selesai'
      AND YEAR(t.created_at) = ?
      ${storeCondition}
    GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
    ORDER BY bulan ASC
    `,
    params
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| MONTHLY REPORT BY STORE (tetap)
|--------------------------------------------------------------------------
*/
const getMonthlyByStore = async (id_store, year) => {
  const [rows] = await pool.query(
    `
    SELECT
      DATE_FORMAT(t.created_at, '%Y-%m') AS bulan,
      COUNT(t.id_transaction) AS total_transaksi,
      COALESCE(SUM(t.total_qty), 0) AS total_qty,
      COALESCE(SUM(t.grand_total), 0) AS total_pendapatan
    FROM transactions t
    WHERE t.id_store = ?
      AND t.status_transaksi = 'selesai'
      AND YEAR(t.created_at) = ?
    GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
    ORDER BY bulan ASC
    `,
    [id_store, year]
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| TOP PRODUCTS BY OWNER (dengan filter toko opsional)
|--------------------------------------------------------------------------
*/
const getTopProductsByOwner = async (id_owner, startDate, endDate, limit = 10, id_store = null) => {
  const filter = buildDateFilter(startDate, endDate, "t");
  let storeCondition = "";
  let params = [id_owner];

  if (id_store) {
    storeCondition = " AND s.id_store = ? ";
    params.push(id_store);
  }
  params.push(...filter.values, Number(limit));

  const [rows] = await pool.query(
    `
    SELECT
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk,
      s.nama_toko,
      COALESCE(SUM(ti.qty), 0) AS total_terjual,
      COALESCE(SUM(ti.subtotal), 0) AS total_pendapatan
    FROM transaction_items ti
    JOIN transactions t ON ti.id_transaction = t.id_transaction
    JOIN stores s ON t.id_store = s.id_store
    WHERE s.id_owner = ?
      AND t.status_transaksi = 'selesai'
      ${storeCondition}
      ${filter.condition}
    GROUP BY
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk,
      s.nama_toko
    ORDER BY total_terjual DESC
    LIMIT ?
    `,
    params
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| TOP PRODUCTS BY STORE (tetap)
|--------------------------------------------------------------------------
*/
const getTopProductsByStore = async (id_store, startDate, endDate, limit = 10) => {
  const filter = buildDateFilter(startDate, endDate, "t");

  const [rows] = await pool.query(
    `
    SELECT
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk,
      COALESCE(SUM(ti.qty), 0) AS total_terjual,
      COALESCE(SUM(ti.subtotal), 0) AS total_pendapatan
    FROM transaction_items ti
    JOIN transactions t ON ti.id_transaction = t.id_transaction
    WHERE t.id_store = ?
      AND t.status_transaksi = 'selesai'
      ${filter.condition}
    GROUP BY
      ti.id_product,
      ti.kode_produk,
      ti.nama_produk
    ORDER BY total_terjual DESC
    LIMIT ?
    `,
    [id_store, ...filter.values, Number(limit)]
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| RECENT TRANSACTIONS BY OWNER (dengan filter toko opsional)
|--------------------------------------------------------------------------
*/
const getRecentTransactionsByOwner = async (id_owner, limit = 10, id_store = null) => {
  let storeCondition = "";
  let params = [id_owner];

  if (id_store) {
    storeCondition = " AND s.id_store = ? ";
    params.push(id_store);
  }
  params.push(Number(limit));

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
      t.grand_total,
      t.metode_pembayaran,
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.created_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE s.id_owner = ?
      ${storeCondition}
    ORDER BY t.id_transaction DESC
    LIMIT ?
    `,
    params
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| RECENT TRANSACTIONS BY STORE (tetap)
|--------------------------------------------------------------------------
*/
const getRecentTransactionsByStore = async (id_store, limit = 10) => {
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
      t.grand_total,
      t.metode_pembayaran,
      t.jumlah_bayar,
      t.kembalian,
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
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| LOW STOCK PRODUCTS BY OWNER (dengan filter toko opsional)
|--------------------------------------------------------------------------
*/
const getLowStockProductsByOwner = async (id_owner, id_store = null) => {
  let storeCondition = "";
  let params = [id_owner];

  if (id_store) {
    storeCondition = " AND s.id_store = ? ";
    params.push(id_store);
  }

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
      p.satuan,
      p.status_produk
    FROM products p
    JOIN stores s ON p.id_store = s.id_store
    WHERE s.id_owner = ?
      AND p.stok <= p.stok_minimum
      AND p.status_produk = 'aktif'
      ${storeCondition}
    ORDER BY p.stok ASC
    `,
    params
  );

  return rows;
};

/*
|--------------------------------------------------------------------------
| LOW STOCK PRODUCTS BY STORE (tetap)
|--------------------------------------------------------------------------
*/
const getLowStockProductsByStore = async (id_store) => {
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
      p.satuan,
      p.status_produk
    FROM products p
    JOIN stores s ON p.id_store = s.id_store
    WHERE p.id_store = ?
      AND p.stok <= p.stok_minimum
      AND p.status_produk = 'aktif'
    ORDER BY p.stok ASC
    `,
    [id_store]
  );

  return rows;
};

module.exports = {
  getSummaryByOwner,
  getSummaryByStore,
  getDailyByOwner,
  getDailyByStore,
  getMonthlyByOwner,
  getMonthlyByStore,
  getTopProductsByOwner,
  getTopProductsByStore,
  getRecentTransactionsByOwner,
  getRecentTransactionsByStore,
  getLowStockProductsByOwner,
  getLowStockProductsByStore,
};