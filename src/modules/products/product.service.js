const productModel = require("./product.model")

/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/
const getAllProducts = async (currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await productModel.findAllByOwner(currentUser.id_user)
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (!currentUser.id_store) {
      throw new Error("User belum terhubung dengan toko")
    }

    return await productModel.findAllByStore(currentUser.id_store)
  }

  throw new Error("Anda tidak memiliki akses ke produk")
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/
const getProductById = async (id_product, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!id_product) {
    throw new Error("ID produk wajib diisi")
  }

  const product = await productModel.findById(id_product)

  if (!product) {
    throw new Error("Produk tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(product.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }
  } else if (["admin", "kasir"].includes(currentUser.role)) {
    if (Number(product.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }
  } else {
    throw new Error("Anda tidak memiliki akses ke produk")
  }

  return product
}

/*
|--------------------------------------------------------------------------
| HELPER: NORMALIZE EMPTY VALUE
|--------------------------------------------------------------------------
*/
const emptyToNull = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const stringValue = value.toString().trim()

  if (stringValue === "" || stringValue === "null" || stringValue === "-") {
    return null
  }

  return value
}

/*
|--------------------------------------------------------------------------
| HELPER: TO NUMBER
|--------------------------------------------------------------------------
*/
const toNumber = (value, defaultValue = 0) => {
  const cleanValue = emptyToNull(value)

  if (cleanValue === null) {
    return defaultValue
  }

  const numberValue = Number(cleanValue)

  if (Number.isNaN(numberValue)) {
    return defaultValue
  }

  return numberValue
}

/*
|--------------------------------------------------------------------------
| HELPER: TO ID
|--------------------------------------------------------------------------
*/
const toId = (value) => {
  const cleanValue = emptyToNull(value)

  if (cleanValue === null) {
    return null
  }

  const numberValue = Number(cleanValue)

  if (Number.isNaN(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

/*
|--------------------------------------------------------------------------
| HELPER: TO STRING
|--------------------------------------------------------------------------
*/
const toStringValue = (value, defaultValue = "") => {
  const cleanValue = emptyToNull(value)

  if (cleanValue === null) {
    return defaultValue
  }

  return cleanValue.toString().trim()
}

/*
|--------------------------------------------------------------------------
| VALIDATE NUMBER
|--------------------------------------------------------------------------
*/
const validateNumberMinZero = (value, fieldName) => {
  if (Number(value || 0) < 0) {
    throw new Error(`${fieldName} tidak boleh kurang dari 0`)
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE PRODUCT DISCOUNT
|--------------------------------------------------------------------------
*/
const validateDiscount = async (id_discount, id_store) => {
  if (!id_discount) {
    return null
  }

  const discount = await productModel.findDiscountByIdAndStore(
    id_discount,
    id_store
  )

  if (!discount) {
    throw new Error("Diskon tidak ditemukan pada toko ini")
  }

  if (discount.status_diskon !== "aktif") {
    throw new Error("Diskon sedang nonaktif")
  }

  const now = new Date()

  if (discount.tanggal_mulai && now < new Date(discount.tanggal_mulai)) {
    throw new Error("Diskon belum mulai")
  }

  if (discount.tanggal_berakhir && now > new Date(discount.tanggal_berakhir)) {
    throw new Error("Diskon sudah berakhir")
  }

  return discount
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT DATA
|--------------------------------------------------------------------------
| Data dari JSON dan multipart/form-data dibuat seragam.
|--------------------------------------------------------------------------
*/
const normalizeProductData = (data = {}) => {
  return {
    id_store: toId(data.id_store),
    id_category: toId(data.id_category),
    id_discount: toId(data.id_discount),

    kode_produk: toStringValue(data.kode_produk),
    barcode: toStringValue(data.barcode),
    nama_produk: toStringValue(data.nama_produk),
    deskripsi: toStringValue(data.deskripsi),

    harga_beli: toNumber(data.harga_beli, 0),
    harga_jual: toNumber(data.harga_jual, 0),
    stok: toNumber(data.stok, 0),
    stok_minimum: toNumber(data.stok_minimum, 0),

    satuan: toStringValue(data.satuan, "pcs"),
    foto: emptyToNull(data.foto),
    status_produk: toStringValue(data.status_produk, "aktif")
  }
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/
const createProduct = async (data = {}, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menambahkan produk")
  }

  const {
    id_store,
    id_category,
    id_discount,
    kode_produk,
    barcode,
    nama_produk,
    deskripsi,
    harga_beli,
    harga_jual,
    stok,
    stok_minimum,
    satuan,
    foto,
    status_produk
  } = normalizeProductData(data)

  if (!kode_produk || !nama_produk) {
    throw new Error("Kode produk dan nama produk wajib diisi")
  }

  validateNumberMinZero(harga_beli, "Harga beli")
  validateNumberMinZero(harga_jual, "Harga jual")
  validateNumberMinZero(stok, "Stok")
  validateNumberMinZero(stok_minimum, "Stok minimum")

  if (status_produk && !["aktif", "nonaktif"].includes(status_produk)) {
    throw new Error("Status produk hanya boleh aktif atau nonaktif")
  }

  let finalStoreId = id_store

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    const store = await productModel.findStoreByIdAndOwner(
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

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko")
    }

    finalStoreId = currentUser.id_store
  }

  if (id_category) {
    const category = await productModel.findCategoryByIdAndStore(
      id_category,
      finalStoreId
    )

    if (!category) {
      throw new Error("Kategori tidak ditemukan pada toko ini")
    }

    if (category.status_kategori !== "aktif") {
      throw new Error("Kategori sedang nonaktif")
    }
  }

  await validateDiscount(id_discount, finalStoreId)

  const kodeExists = await productModel.findByKodeAndStore(
    kode_produk,
    finalStoreId
  )

  if (kodeExists) {
    throw new Error("Kode produk sudah digunakan pada toko ini")
  }

  if (barcode) {
    const barcodeExists = await productModel.findByBarcodeAndStore(
      barcode,
      finalStoreId
    )

    if (barcodeExists) {
      throw new Error("Barcode sudah digunakan pada toko ini")
    }
  }

  return await productModel.create({
    id_store: finalStoreId,
    id_category: id_category || null,
    id_discount: id_discount || null,
    kode_produk,
    barcode: barcode || null,
    nama_produk,
    deskripsi: deskripsi || null,
    harga_beli,
    harga_jual,
    stok,
    stok_minimum,
    satuan: satuan || "pcs",
    foto: foto || null,
    status_produk: status_produk || "aktif"
  })
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/
const updateProduct = async (id_product, data = {}, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!id_product) {
    throw new Error("ID produk wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat memperbarui produk")
  }

  const product = await productModel.findById(id_product)

  if (!product) {
    throw new Error("Produk tidak ditemukan")
  }

  const {
    id_store,
    id_category,
    id_discount,
    kode_produk,
    barcode,
    nama_produk,
    deskripsi,
    harga_beli,
    harga_jual,
    stok,
    stok_minimum,
    satuan,
    foto,
    status_produk
  } = normalizeProductData(data)

  if (!kode_produk || !nama_produk || !status_produk) {
    throw new Error("Kode produk, nama produk, dan status produk wajib diisi")
  }

  if (!["aktif", "nonaktif"].includes(status_produk)) {
    throw new Error("Status produk hanya boleh aktif atau nonaktif")
  }

  validateNumberMinZero(harga_beli, "Harga beli")
  validateNumberMinZero(harga_jual, "Harga jual")
  validateNumberMinZero(stok, "Stok")
  validateNumberMinZero(stok_minimum, "Stok minimum")

  let finalStoreId = id_store || product.id_store

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    if (Number(product.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }

    const store = await productModel.findStoreByIdAndOwner(
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

  if (currentUser.role === "admin") {
    if (Number(product.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }

    finalStoreId = currentUser.id_store
  }

  if (id_category) {
    const category = await productModel.findCategoryByIdAndStore(
      id_category,
      finalStoreId
    )

    if (!category) {
      throw new Error("Kategori tidak ditemukan pada toko ini")
    }

    if (category.status_kategori !== "aktif") {
      throw new Error("Kategori sedang nonaktif")
    }
  }

  await validateDiscount(id_discount, finalStoreId)

  const kodeExists = await productModel.findByKodeAndStore(
    kode_produk,
    finalStoreId
  )

  if (
    kodeExists &&
    Number(kodeExists.id_product) !== Number(id_product)
  ) {
    throw new Error("Kode produk sudah digunakan pada toko ini")
  }

  if (barcode) {
    const barcodeExists = await productModel.findByBarcodeAndStore(
      barcode,
      finalStoreId
    )

    if (
      barcodeExists &&
      Number(barcodeExists.id_product) !== Number(id_product)
    ) {
      throw new Error("Barcode sudah digunakan pada toko ini")
    }
  }

  const updated = await productModel.update(id_product, {
    id_store: finalStoreId,
    id_category: id_category || null,
    id_discount: id_discount || null,
    kode_produk,
    barcode: barcode || null,
    nama_produk,
    deskripsi: deskripsi || null,
    harga_beli,
    harga_jual,
    stok,
    stok_minimum,
    satuan: satuan || "pcs",
    foto: foto || product.foto || null,
    status_produk
  })

  if (!updated) {
    throw new Error("Gagal memperbarui produk")
  }

  return await productModel.findById(id_product)
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT FOTO
|--------------------------------------------------------------------------
*/
const updateProductFoto = async (id_product, foto, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!id_product) {
    throw new Error("ID produk wajib diisi")
  }

  if (!foto) {
    throw new Error("Foto produk wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat memperbarui foto produk")
  }

  const product = await productModel.findById(id_product)

  if (!product) {
    throw new Error("Produk tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(product.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }
  }

  if (currentUser.role === "admin") {
    if (Number(product.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }
  }

  const updated = await productModel.updateFoto(id_product, foto)

  if (!updated) {
    throw new Error("Gagal memperbarui foto produk")
  }

  return await productModel.findById(id_product)
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/
const deleteProduct = async (id_product, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!id_product) {
    throw new Error("ID produk wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menghapus produk")
  }

  const product = await productModel.findById(id_product)

  if (!product) {
    throw new Error("Produk tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(product.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }
  }

  if (currentUser.role === "admin") {
    if (Number(product.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke produk ini")
    }
  }

  const deleted = await productModel.remove(id_product)

  if (!deleted) {
    throw new Error("Gagal menghapus produk")
  }

  return {
    id_product: Number(id_product),
    pesan: "Produk berhasil dihapus"
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductFoto,
  deleteProduct
}