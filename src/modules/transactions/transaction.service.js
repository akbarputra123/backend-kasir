const transactionModel = require("./transaction.model")
const productModel = require("../products/product.model")
const variantModel = require("../variant/variant.model")
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
    return false;
  }

  if (product.status_diskon !== "aktif") {
    return false;
  }

  const now = new Date();

  if (product.tanggal_mulai) {
    const start = new Date(product.tanggal_mulai);
    start.setHours(0, 0, 0, 0);

    if (now < start) {
      return false;
    }
  }

  if (product.tanggal_berakhir) {
    const end = new Date(product.tanggal_berakhir);
    end.setHours(23, 59, 59, 999);

    if (now > end) {
      return false;
    }
  }

  return true;
};
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
| VALIDATE PRODUCT VARIANTS
|--------------------------------------------------------------------------
*/
const validateProductVariants = async (
  product,
  variantOptions = []
) => {
  if (!Array.isArray(variantOptions) || variantOptions.length === 0) {
    return {
      variants: [],
      tambahanHarga: 0
    }
  }

  const variants = []
  let tambahanHarga = 0

  for (const idVariantOption of variantOptions) {
    const option =
      await variantModel.findOptionById(idVariantOption)

    if (!option) {
      throw new Error(
        `Varian dengan ID ${idVariantOption} tidak ditemukan`
      )
    }

    // Pastikan option milik produk yang dipilih
    if (Number(option.id_product) !== Number(product.id_product)) {
      throw new Error(
        `Varian ${option.nama_option} bukan milik produk ${product.nama_produk}`
      )
    }

    if (option.status_option !== "aktif") {
      throw new Error(
        `Varian ${option.nama_option} sedang nonaktif`
      )
    }

    tambahanHarga += Number(option.tambahan_harga || 0)

    variants.push({
      id_variant_option: option.id_variant_option,
      nama_group: option.nama_group,
      nama_option: option.nama_option,
      tambahan_harga: Number(option.tambahan_harga || 0)
    })
  }

  return {
    variants,
    tambahanHarga
  }
}

/*
|--------------------------------------------------------------------------
| CREATE TRANSACTION
|--------------------------------------------------------------------------
*/
const createTransaction = async (data, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!["owner", "admin", "kasir"].includes(currentUser.role)) {
    throw new Error("Anda tidak memiliki akses membuat transaksi")
  }

  const {
    id_store,
    items,
    metode_pembayaran,
    jumlah_bayar,
    catatan
  } = data

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Item transaksi wajib diisi")
  }

  let finalStoreId = id_store

  // =====================================================
  // VALIDASI TOKO
  // =====================================================

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    const store = await transactionModel.findStoreByIdAndOwner(
      id_store,
      currentUser.id_user
    )

    if (!store) {
      throw new Error("Toko tidak ditemukan atau bukan milik owner ini")
    }

    if (store.status_toko !== "aktif") {
      throw new Error("Toko sedang nonaktif")
    }
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (!currentUser.id_store) {
      throw new Error("User belum terhubung dengan toko")
    }

    finalStoreId = currentUser.id_store
  }

  const storeData = await transactionModel.findStoreById(finalStoreId)

  if (!storeData) {
    throw new Error("Toko tidak ditemukan")
  }

  if (storeData.status_toko !== "aktif") {
    throw new Error("Toko sedang nonaktif")
  }

  const ppnPersen =
    storeData.ppn_aktif === "ya"
      ? Number(storeData.ppn_persen || 0)
      : 0

  if (ppnPersen < 0 || ppnPersen > 100) {
    throw new Error("PPN toko tidak valid")
  }

  if (
    metode_pembayaran &&
    !["tunai", "transfer", "qris", "debit", "ewallet"].includes(
      metode_pembayaran
    )
  ) {
    throw new Error("Metode pembayaran tidak valid")
  }

  const normalizedItems = []

  let subtotalAsli = 0
  let totalDiskonProduk = 0
  let subtotalSetelahDiskon = 0
  let totalQty = 0

  const businessCategory = Number(storeData.id_business_category)

  // =====================================================
  // VALIDASI ITEM
  // =====================================================

  for (const item of items) {
    if (!item.id_product || !item.qty) {
      throw new Error("Setiap item wajib memiliki id_product dan qty")
    }

    const qty = Number(item.qty)

    if (qty <= 0) {
      throw new Error("Qty produk harus lebih dari 0")
    }

    const product = await productModel.findById(item.id_product)
    const variantResult =await validateProductVariants(product,item.variant_options || [])

    if (!product) {
      throw new Error("Produk tidak ditemukan")
    }

    if (Number(product.id_store) !== Number(finalStoreId)) {
      throw new Error(
        `Produk ${product.nama_produk} bukan milik toko ini`
      )
    }

    if (product.status_produk !== "aktif") {
      throw new Error(
        `Produk ${product.nama_produk} sedang nonaktif`
      )
    }

    // ===============================================
    // RETAIL -> CEK STOK
    // COFFEE SHOP -> TIDAK CEK STOK
    // ===============================================

    if (businessCategory === 1) {
      const stok = Number(product.stok || 0)

      if (stok < qty) {
        throw new Error(
          `Stok produk ${product.nama_produk} tidak mencukupi`
        )
      }
    }

    const hargaAsli = Number(product.harga_jual || 0)

    if (hargaAsli < 0) {
      throw new Error(
        `Harga produk ${product.nama_produk} tidak valid`
      )
    }

    const discountResult = calculateProductDiscount(product)

    const diskonSatuan = Number(
      discountResult.diskon_satuan || 0
    )
const hargaFinal =
  Number(discountResult.harga_final || 0) +
  Number(variantResult.tambahanHarga || 0)

    const subtotalItemAsli = hargaAsli * qty
    const totalDiskonItem = diskonSatuan * qty
    const subtotalItemFinal = hargaFinal * qty

    normalizedItems.push({
      id_product: product.id_product,

      // WAJIB
      kode_produk: product.kode_produk || "",
      nama_produk: product.nama_produk,

      qty,

      harga_asli: hargaAsli,

      id_discount: discountResult.id_discount,
      nama_diskon: discountResult.nama_diskon,
      tipe_diskon: discountResult.tipe_diskon,
      nilai_diskon: discountResult.nilai_diskon,

      diskon: totalDiskonItem,

      harga_jual: hargaFinal,
      subtotal: subtotalItemFinal
    })

    subtotalAsli += subtotalItemAsli
    totalDiskonProduk += totalDiskonItem
    subtotalSetelahDiskon += subtotalItemFinal
    totalQty += qty
  }

  const pajak =
    subtotalSetelahDiskon * (ppnPersen / 100)

  const grandTotal =
    subtotalSetelahDiskon + pajak

  const finalJumlahBayar = Number(jumlah_bayar || 0)

  if (finalJumlahBayar < grandTotal) {
    throw new Error("Jumlah bayar kurang dari grand total")
  }

  const kembalian =
    finalJumlahBayar - grandTotal

  const result =
    await transactionModel.createTransaction({
      id_store: finalStoreId,
      id_user: currentUser.id_user,

      total_item: normalizedItems.length,
      total_qty: totalQty,

      subtotal: subtotalAsli,
      diskon: totalDiskonProduk,
      pajak,
      ppn_persen: ppnPersen,
      grand_total: grandTotal,

      metode_pembayaran:
        metode_pembayaran || "tunai",

      jumlah_bayar: finalJumlahBayar,
      kembalian,
      catatan,

      items: normalizedItems
    })

  return await getTransactionById(
    result.id_transaction,
    currentUser
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