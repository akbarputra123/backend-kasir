const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND RECEIPT TRANSACTION
|--------------------------------------------------------------------------
| Mengambil data transaksi, toko, dan kasir.
|--------------------------------------------------------------------------
*/
const findReceiptTransaction = async (id_transaction) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.id_owner,
      s.nama_toko,
      s.alamat AS alamat_toko,
      s.no_hp AS no_hp_toko,
      s.email AS email_toko,
      s.logo AS logo_toko,
      s.ppn_aktif,
      s.ppn_persen AS ppn_persen_toko,

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
| FIND RECEIPT ITEMS
|--------------------------------------------------------------------------
| Mengambil item transaksi untuk struk.
|--------------------------------------------------------------------------
*/
const findReceiptItems = async (id_transaction) => {
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

module.exports = {
  findReceiptTransaction,
  findReceiptItems
}