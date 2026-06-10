const receiptModel = require("./receipt.model")

/*
|--------------------------------------------------------------------------
| FORMAT MONEY NUMBER
|--------------------------------------------------------------------------
| Memastikan angka decimal dari MySQL menjadi number.
|--------------------------------------------------------------------------
*/
const toNumber = (value) => {
  return Number(value || 0)
}

/*
|--------------------------------------------------------------------------
| CHECK RECEIPT ACCESS
|--------------------------------------------------------------------------
*/
const checkReceiptAccess = (receipt, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    if (Number(receipt.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke struk ini")
    }

    return true
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (Number(receipt.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke struk ini")
    }

    return true
  }

  throw new Error("Anda tidak memiliki akses ke struk")
}

/*
|--------------------------------------------------------------------------
| GET RECEIPT BY TRANSACTION
|--------------------------------------------------------------------------
*/
const getReceiptByTransaction = async (id_transaction, currentUser) => {
  if (!id_transaction) {
    throw new Error("ID transaksi wajib diisi")
  }

  const receipt = await receiptModel.findReceiptTransaction(id_transaction)

  if (!receipt) {
    throw new Error("Transaksi tidak ditemukan")
  }

  checkReceiptAccess(receipt, currentUser)

  const items = await receiptModel.findReceiptItems(id_transaction)

  return {
    store: {
      id_store: receipt.id_store,
      nama_toko: receipt.nama_toko,
      alamat: receipt.alamat_toko,
      no_hp: receipt.no_hp_toko,
      email: receipt.email_toko,
      logo: receipt.logo_toko,
      ppn_aktif: receipt.ppn_aktif,
      ppn_persen: toNumber(receipt.ppn_persen_toko)
    },

    cashier: {
      id_user: receipt.id_user,
      nama_kasir: receipt.nama_kasir || "-"
    },

    transaction: {
      id_transaction: receipt.id_transaction,
      kode_transaksi: receipt.kode_transaksi,
      total_item: Number(receipt.total_item || 0),
      total_qty: Number(receipt.total_qty || 0),

      subtotal: toNumber(receipt.subtotal),
      diskon: toNumber(receipt.diskon),
      pajak: toNumber(receipt.pajak),
      ppn_persen: toNumber(receipt.ppn_persen),
      grand_total: toNumber(receipt.grand_total),

      metode_pembayaran: receipt.metode_pembayaran,
      jumlah_bayar: toNumber(receipt.jumlah_bayar),
      kembalian: toNumber(receipt.kembalian),
      status_transaksi: receipt.status_transaksi,
      catatan: receipt.catatan,
      created_at: receipt.created_at,
      updated_at: receipt.updated_at
    },

    items: items.map((item) => ({
      id_transaction_item: item.id_transaction_item,
      id_product: item.id_product,

      kode_produk: item.kode_produk,
      nama_produk: item.nama_produk,

      harga_asli: toNumber(item.harga_asli),

      discount: item.id_discount
        ? {
            id_discount: item.id_discount,
            nama_diskon: item.nama_diskon,
            tipe_diskon: item.tipe_diskon,
            nilai_diskon: toNumber(item.nilai_diskon),
            diskon: toNumber(item.diskon)
          }
        : null,

      harga_jual: toNumber(item.harga_jual),
      qty: Number(item.qty || 0),
      subtotal: toNumber(item.subtotal),
      created_at: item.created_at
    }))
  }
}

module.exports = {
  getReceiptByTransaction
}