const transactionModel = require("./transaction.model")
const productModel = require("../products/product.model")

/*
|--------------------------------------------------------------------------
| GET ALL TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getAllTransactions = async (currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await transactionModel.findAllByOwner(currentUser.id_user)
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (!currentUser.id_store) {
      throw new Error("User belum terhubung dengan toko")
    }

    return await transactionModel.findAllByStore(currentUser.id_store)
  }

  throw new Error("Anda tidak memiliki akses ke transaksi")
}

/*
|--------------------------------------------------------------------------
| GET TRANSACTION BY ID
|--------------------------------------------------------------------------
*/
const getTransactionById = async (id_transaction, currentUser) => {
  if (!id_transaction) {
    throw new Error("ID transaksi wajib diisi")
  }

  const transaction = await transactionModel.findById(id_transaction)

  if (!transaction) {
    throw new Error("Transaksi tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(transaction.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke transaksi ini")
    }
  } else if (["admin", "kasir"].includes(currentUser.role)) {
    if (Number(transaction.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke transaksi ini")
    }
  } else {
    throw new Error("Anda tidak memiliki akses ke transaksi")
  }

  const items = await transactionModel.findItemsByTransactionId(id_transaction)

  return {
    ...transaction,
    items
  }
}

/*
|--------------------------------------------------------------------------
| CHECK DISCOUNT ACTIVE
|--------------------------------------------------------------------------
*/
const isDiscountActive = (product) => {
  if (!product.id_discount) {
    return false
  }

  if (product.status_diskon !== "aktif") {
    return false
  }

  const now = new Date()

  if (product.tanggal_mulai && now < new Date(product.tanggal_mulai)) {
    return false
  }

  if (product.tanggal_berakhir && now > new Date(product.tanggal_berakhir)) {
    return false
  }

  return true
}

/*
|--------------------------------------------------------------------------
| CALCULATE PRODUCT DISCOUNT
|--------------------------------------------------------------------------
*/
const calculateProductDiscount = (product) => {
  const hargaAsli = Number(product.harga_jual || 0)

  if (!isDiscountActive(product)) {
    return {
      id_discount: null,
      nama_diskon: null,
      tipe_diskon: null,
      nilai_diskon: 0,
      diskon_satuan: 0,
      harga_final: hargaAsli
    }
  }

  const nilaiDiskon = Number(product.nilai_diskon || 0)
  let diskonSatuan = 0

  if (product.tipe_diskon === "persen") {
    diskonSatuan = hargaAsli * (nilaiDiskon / 100)
  }

  if (product.tipe_diskon === "nominal") {
    diskonSatuan = nilaiDiskon
  }

  if (diskonSatuan < 0) {
    diskonSatuan = 0
  }

  if (diskonSatuan > hargaAsli) {
    diskonSatuan = hargaAsli
  }

  const hargaFinal = hargaAsli - diskonSatuan

  return {
    id_discount: product.id_discount,
    nama_diskon: product.nama_diskon,
    tipe_diskon: product.tipe_diskon,
    nilai_diskon: nilaiDiskon,
    diskon_satuan: diskonSatuan,
    harga_final: hargaFinal
  }
}

/*
|--------------------------------------------------------------------------
| CREATE TRANSACTION
|--------------------------------------------------------------------------
*/
const product = await productModel.findById(item.id_product)

if (!product) {
  throw new Error("Produk tidak ditemukan")
}

if (Number(product.id_store) !== Number(finalStoreId)) {
  throw new Error(`Produk ${product.nama_produk} bukan milik toko ini`)
}

// =====================================================
// VALIDASI KATEGORI BISNIS
// =====================================================
if (
  Number(product.id_business_category) !==
  Number(storeData.id_business_category)
) {
  throw new Error(
    `Produk ${product.nama_produk} tidak sesuai dengan kategori bisnis toko`
  )
}

if (product.status_produk !== "aktif") {
  throw new Error(`Produk ${product.nama_produk} sedang nonaktif`)
}

// =====================================================
// CEK STOK HANYA UNTUK BISNIS SELAIN COFFEE SHOP
// id_business_category = 1 => Coffee Shop
// =====================================================
const useStock =
  Number(storeData.id_business_category) !== 1

if (
  useStock &&
  Number(product.stok) < Number(item.qty)
) {
  throw new Error(
    `Stok produk ${product.nama_produk} tidak mencukupi`
  )
}

const qty = Number(item.qty)
const hargaAsli = Number(product.harga_jual || 0)

if (hargaAsli < 0) {
  throw new Error(
    `Harga produk ${product.nama_produk} tidak valid`
  )
}
/*
|--------------------------------------------------------------------------
| CANCEL TRANSACTION
|--------------------------------------------------------------------------
*/
const cancelTransaction = async (id_transaction, data, currentUser) => {
  if (!id_transaction) {
    throw new Error("ID transaksi wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat membatalkan transaksi")
  }

  const transaction = await transactionModel.findById(id_transaction)

  if (!transaction) {
    throw new Error("Transaksi tidak ditemukan")
  }

  if (transaction.status_transaksi === "dibatalkan") {
    throw new Error("Transaksi sudah dibatalkan")
  }

  if (currentUser.role === "owner") {
    if (Number(transaction.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke transaksi ini")
    }
  }

  if (currentUser.role === "admin") {
    if (Number(transaction.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke transaksi ini")
    }
  }

  const result = await transactionModel.cancelTransaction(
    id_transaction,
    {
      id_user: currentUser.id_user,
      catatan: data.catatan
    }
  )

  return result
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  cancelTransaction
}