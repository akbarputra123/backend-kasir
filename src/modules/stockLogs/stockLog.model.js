const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ALL STOCK LOGS BY OWNER
|--------------------------------------------------------------------------
| Owner melihat riwayat stok dari semua toko miliknya.
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      sl.id_stock_log,
      sl.id_store,
      s.nama_toko,
      sl.id_product,
      p.kode_produk,
      p.nama_produk,
      sl.id_user,
      u.nama_lengkap AS nama_user,
      sl.tipe,
      sl.jumlah,
      sl.stok_sebelum,
      sl.stok_sesudah,
      sl.keterangan,
      sl.created_at
    FROM stock_logs sl
    JOIN stores s ON sl.id_store = s.id_store
    JOIN products p ON sl.id_product = p.id_product
    LEFT JOIN users u ON sl.id_user = u.id_user
    WHERE s.id_owner = ?
    ORDER BY sl.id_stock_log DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL STOCK LOGS BY STORE
|--------------------------------------------------------------------------
| Admin/kasir melihat riwayat stok toko sendiri.
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      sl.id_stock_log,
      sl.id_store,
      s.nama_toko,
      sl.id_product,
      p.kode_produk,
      p.nama_produk,
      sl.id_user,
      u.nama_lengkap AS nama_user,
      sl.tipe,
      sl.jumlah,
      sl.stok_sebelum,
      sl.stok_sesudah,
      sl.keterangan,
      sl.created_at
    FROM stock_logs sl
    JOIN stores s ON sl.id_store = s.id_store
    JOIN products p ON sl.id_product = p.id_product
    LEFT JOIN users u ON sl.id_user = u.id_user
    WHERE sl.id_store = ?
    ORDER BY sl.id_stock_log DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STOCK LOGS BY PRODUCT
|--------------------------------------------------------------------------
*/
const findByProduct = async (id_product) => {
  const [rows] = await pool.query(
    `
    SELECT
      sl.id_stock_log,
      sl.id_store,
      s.nama_toko,
      sl.id_product,
      p.kode_produk,
      p.nama_produk,
      sl.id_user,
      u.nama_lengkap AS nama_user,
      sl.tipe,
      sl.jumlah,
      sl.stok_sebelum,
      sl.stok_sesudah,
      sl.keterangan,
      sl.created_at
    FROM stock_logs sl
    JOIN stores s ON sl.id_store = s.id_store
    JOIN products p ON sl.id_product = p.id_product
    LEFT JOIN users u ON sl.id_user = u.id_user
    WHERE sl.id_product = ?
    ORDER BY sl.id_stock_log DESC
    `,
    [id_product]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND PRODUCT BY ID
|--------------------------------------------------------------------------
| Mengambil produk dan data owner toko.
|--------------------------------------------------------------------------
*/
const findProductById = async (id_product) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_product,
      p.id_store,
      s.id_owner,
      s.nama_toko,
      p.kode_produk,
      p.nama_produk,
      p.stok,
      p.status_produk
    FROM products p
    JOIN stores s ON p.id_store = s.id_store
    WHERE p.id_product = ?
    LIMIT 1
    `,
    [id_product]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| CREATE STOCK LOG ONLY
|--------------------------------------------------------------------------
| Dipakai juga nanti saat transaksi penjualan.
|--------------------------------------------------------------------------
*/
const createLog = async (data, connection = pool) => {
  const [result] = await connection.query(
    `
    INSERT INTO stock_logs
    (
      id_store,
      id_product,
      id_user,
      tipe,
      jumlah,
      stok_sebelum,
      stok_sesudah,
      keterangan
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.id_store,
      data.id_product,
      data.id_user || null,
      data.tipe,
      data.jumlah,
      data.stok_sebelum,
      data.stok_sesudah,
      data.keterangan || null
    ]
  )

  return {
    id_stock_log: result.insertId,
    ...data
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT STOCK
|--------------------------------------------------------------------------
*/
const updateProductStock = async (id_product, stok_baru, connection = pool) => {
  const [result] = await connection.query(
    `
    UPDATE products
    SET stok = ?
    WHERE id_product = ?
    `,
    [stok_baru, id_product]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| CHANGE STOCK WITH TRANSACTION
|--------------------------------------------------------------------------
| Menjaga update stok dan insert log tetap aman.
|--------------------------------------------------------------------------
*/
const changeStock = async (data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [productRows] = await connection.query(
      `
      SELECT
        p.id_product,
        p.id_store,
        s.id_owner,
        p.nama_produk,
        p.stok,
        p.status_produk
      FROM products p
      JOIN stores s ON p.id_store = s.id_store
      WHERE p.id_product = ?
      LIMIT 1
      FOR UPDATE
      `,
      [data.id_product]
    )

    const product = productRows[0] || null

    if (!product) {
      throw new Error("Produk tidak ditemukan")
    }

    const stokSebelum = Number(product.stok)
    let stokSesudah = stokSebelum

    if (data.tipe === "masuk") {
      stokSesudah = stokSebelum + Number(data.jumlah)
    }

    if (data.tipe === "keluar") {
      stokSesudah = stokSebelum - Number(data.jumlah)
    }

    if (data.tipe === "penyesuaian") {
      stokSesudah = Number(data.stok_baru)
    }

    if (stokSesudah < 0) {
      throw new Error("Stok tidak boleh kurang dari 0")
    }

    await updateProductStock(
      data.id_product,
      stokSesudah,
      connection
    )

    const log = await createLog(
      {
        id_store: product.id_store,
        id_product: data.id_product,
        id_user: data.id_user,
        tipe: data.tipe,
        jumlah:
          data.tipe === "penyesuaian"
            ? Math.abs(stokSesudah - stokSebelum)
            : Number(data.jumlah),
        stok_sebelum: stokSebelum,
        stok_sesudah: stokSesudah,
        keterangan: data.keterangan
      },
      connection
    )

    await connection.commit()

    return {
      produk: {
        id_product: product.id_product,
        nama_produk: product.nama_produk,
        stok_sebelum: stokSebelum,
        stok_sesudah: stokSesudah
      },
      log
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  findAllByOwner,
  findAllByStore,
  findByProduct,
  findProductById,
  createLog,
  updateProductStock,
  changeStock
}