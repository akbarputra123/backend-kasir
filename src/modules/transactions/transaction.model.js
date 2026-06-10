const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ALL TRANSACTIONS BY OWNER
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
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
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.catatan,
      t.created_at,
      t.updated_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE s.id_owner = ?
    ORDER BY t.id_transaction DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL TRANSACTIONS BY STORE
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
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
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.catatan,
      t.created_at,
      t.updated_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE t.id_store = ?
    ORDER BY t.id_transaction DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND TRANSACTION BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_transaction) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.id_owner,
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
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.catatan,
      t.created_at,
      t.updated_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE t.id_transaction = ?
    LIMIT 1
    `,
    [id_transaction]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND TRANSACTION ITEMS
|--------------------------------------------------------------------------
*/
const findItemsByTransactionId = async (id_transaction) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_transaction_item,
      id_transaction,
      id_product,
      kode_produk,
      nama_produk,
      harga_asli,
      id_discount,
      nama_diskon,
      tipe_diskon,
      nilai_diskon,
      diskon,
      harga_jual,
      qty,
      subtotal,
      created_at
    FROM transaction_items
    WHERE id_transaction = ?
    ORDER BY id_transaction_item ASC
    `,
    [id_transaction]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
*/
const findStoreByIdAndOwner = async (id_store, id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko,
      status_toko,
      ppn_aktif,
      ppn_persen
    FROM stores
    WHERE id_store = ?
      AND id_owner = ?
    LIMIT 1
    `,
    [id_store, id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID
|--------------------------------------------------------------------------
| Dipakai service untuk mengambil PPN toko.
|--------------------------------------------------------------------------
*/
const findStoreById = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko,
      status_toko,
      ppn_aktif,
      ppn_persen
    FROM stores
    WHERE id_store = ?
    LIMIT 1
    `,
    [id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| GENERATE TRANSACTION CODE
|--------------------------------------------------------------------------
*/
const generateTransactionCode = async (id_store, connection = pool) => {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")

  const prefix = `TRX-${yyyy}${mm}${dd}`

  const [rows] = await connection.query(
    `
    SELECT COUNT(*) AS total
    FROM transactions
    WHERE id_store = ?
      AND DATE(created_at) = CURDATE()
    `,
    [id_store]
  )

  const number = Number(rows[0].total) + 1
  const sequence = String(number).padStart(4, "0")

  return `${prefix}-${sequence}`
}

/*
|--------------------------------------------------------------------------
| CREATE TRANSACTION WITH ITEMS
|--------------------------------------------------------------------------
| data.subtotal     = total harga asli sebelum diskon
| data.diskon       = total diskon produk
| data.pajak        = nilai PPN rupiah
| data.ppn_persen   = persen PPN dari store
| data.grand_total  = total akhir
|--------------------------------------------------------------------------
*/
const createTransaction = async (data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const kodeTransaksi = await generateTransactionCode(
      data.id_store,
      connection
    )

    const [trxResult] = await connection.query(
      `
      INSERT INTO transactions
      (
        id_store,
        id_user,
        kode_transaksi,
        total_item,
        total_qty,
        subtotal,
        diskon,
        pajak,
        ppn_persen,
        grand_total,
        metode_pembayaran,
        jumlah_bayar,
        kembalian,
        status_transaksi,
        catatan
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'selesai', ?)
      `,
      [
        data.id_store,
        data.id_user || null,
        kodeTransaksi,
        data.total_item,
        data.total_qty,
        data.subtotal,
        data.diskon,
        data.pajak,
        data.ppn_persen || 0,
        data.grand_total,
        data.metode_pembayaran,
        data.jumlah_bayar,
        data.kembalian,
        data.catatan || null
      ]
    )

    const idTransaction = trxResult.insertId

    for (const item of data.items) {
      const [productRows] = await connection.query(
        `
        SELECT
          p.id_product,
          p.id_store,
          p.kode_produk,
          p.nama_produk,
          p.harga_jual,
          p.stok,
          p.status_produk
        FROM products p
        WHERE p.id_product = ?
        LIMIT 1
        FOR UPDATE
        `,
        [item.id_product]
      )

      const product = productRows[0] || null

      if (!product) {
        throw new Error("Produk tidak ditemukan")
      }

      if (Number(product.id_store) !== Number(data.id_store)) {
        throw new Error(`Produk ${product.nama_produk} bukan milik toko ini`)
      }

      if (product.status_produk !== "aktif") {
        throw new Error(`Produk ${product.nama_produk} sedang nonaktif`)
      }

      if (Number(product.stok) < Number(item.qty)) {
        throw new Error(`Stok produk ${product.nama_produk} tidak mencukupi`)
      }

      const stokSebelum = Number(product.stok)
      const stokSesudah = stokSebelum - Number(item.qty)

      await connection.query(
        `
        INSERT INTO transaction_items
        (
          id_transaction,
          id_product,
          kode_produk,
          nama_produk,
          harga_asli,
          id_discount,
          nama_diskon,
          tipe_diskon,
          nilai_diskon,
          diskon,
          harga_jual,
          qty,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          idTransaction,
          product.id_product,
          product.kode_produk,
          product.nama_produk,

          item.harga_asli,
          item.id_discount || null,
          item.nama_diskon || null,
          item.tipe_diskon || null,
          item.nilai_diskon || 0,
          item.diskon || 0,

          item.harga_jual,
          item.qty,
          item.subtotal
        ]
      )

      await connection.query(
        `
        UPDATE products
        SET stok = ?
        WHERE id_product = ?
        `,
        [stokSesudah, product.id_product]
      )

      await connection.query(
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
        VALUES (?, ?, ?, 'keluar', ?, ?, ?, ?)
        `,
        [
          data.id_store,
          product.id_product,
          data.id_user || null,
          item.qty,
          stokSebelum,
          stokSesudah,
          `Transaksi ${kodeTransaksi}`
        ]
      )
    }

    await connection.commit()

    return {
      id_transaction: idTransaction,
      kode_transaksi: kodeTransaksi
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL TRANSACTION
|--------------------------------------------------------------------------
| Membatalkan transaksi dan mengembalikan stok.
|--------------------------------------------------------------------------
*/
const cancelTransaction = async (id_transaction, data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [trxRows] = await connection.query(
      `
      SELECT
        id_transaction,
        id_store,
        id_user,
        kode_transaksi,
        status_transaksi
      FROM transactions
      WHERE id_transaction = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_transaction]
    )

    const trx = trxRows[0] || null

    if (!trx) {
      throw new Error("Transaksi tidak ditemukan")
    }

    if (trx.status_transaksi === "dibatalkan") {
      throw new Error("Transaksi sudah dibatalkan")
    }

    const [items] = await connection.query(
      `
      SELECT
        id_product,
        qty
      FROM transaction_items
      WHERE id_transaction = ?
      `,
      [id_transaction]
    )

    for (const item of items) {
      if (!item.id_product) continue

      const [productRows] = await connection.query(
        `
        SELECT
          id_product,
          stok
        FROM products
        WHERE id_product = ?
        LIMIT 1
        FOR UPDATE
        `,
        [item.id_product]
      )

      const product = productRows[0] || null

      if (!product) continue

      const stokSebelum = Number(product.stok)
      const stokSesudah = stokSebelum + Number(item.qty)

      await connection.query(
        `
        UPDATE products
        SET stok = ?
        WHERE id_product = ?
        `,
        [stokSesudah, item.id_product]
      )

      await connection.query(
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
        VALUES (?, ?, ?, 'masuk', ?, ?, ?, ?)
        `,
        [
          trx.id_store,
          item.id_product,
          data.id_user || null,
          item.qty,
          stokSebelum,
          stokSesudah,
          `Pembatalan transaksi ${trx.kode_transaksi}`
        ]
      )
    }

    await connection.query(
      `
      UPDATE transactions
      SET
        status_transaksi = 'dibatalkan',
        catatan = ?
      WHERE id_transaction = ?
      `,
      [
        data.catatan || "Transaksi dibatalkan",
        id_transaction
      ]
    )

    await connection.commit()

    return {
      id_transaction: Number(id_transaction),
      kode_transaksi: trx.kode_transaksi,
      status_transaksi: "dibatalkan"
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
  findById,
  findItemsByTransactionId,
  findStoreByIdAndOwner,
  findStoreById,
  createTransaction,
  cancelTransaction
}