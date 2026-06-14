const productModel = require("./product.model")

/*
|--------------------------------------------------------------------------
| CREATE SERVICE ERROR
|--------------------------------------------------------------------------
*/
const createServiceError = (
  message,
  statusCode = 400,
  code = "PRODUCT_SERVICE_ERROR",
  details = null
) => {
  const error = new Error(message)

  error.statusCode = statusCode
  error.code = code

  if (details) {
    error.details = details
  }

  return error
}

/*
|--------------------------------------------------------------------------
| VALIDATE CURRENT USER
|--------------------------------------------------------------------------
*/
const validateCurrentUser = (currentUser) => {
  if (!currentUser || !currentUser.id_user) {
    throw createServiceError(
      "User tidak valid",
      401,
      "INVALID_USER"
    )
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE EMPTY VALUE
|--------------------------------------------------------------------------
*/
const emptyToNull = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  const stringValue = String(value).trim()

  if (
    stringValue === "" ||
    stringValue.toLowerCase() === "null" ||
    stringValue === "-"
  ) {
    return null
  }

  return value
}

/*
|--------------------------------------------------------------------------
| TO NUMBER
|--------------------------------------------------------------------------
*/
const toNumber = (
  value,
  defaultValue = 0
) => {
  const cleanValue = emptyToNull(value)

  if (cleanValue === null) {
    return defaultValue
  }

  const numberValue = Number(cleanValue)

  if (!Number.isFinite(numberValue)) {
    throw createServiceError(
      `Nilai ${value} harus berupa angka`,
      422,
      "INVALID_NUMBER"
    )
  }

  return numberValue
}

/*
|--------------------------------------------------------------------------
| TO ID
|--------------------------------------------------------------------------
*/
const toId = (value) => {
  const cleanValue = emptyToNull(value)

  if (cleanValue === null) {
    return null
  }

  const numberValue = Number(cleanValue)

  if (
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    return null
  }

  return numberValue
}

/*
|--------------------------------------------------------------------------
| TO STRING
|--------------------------------------------------------------------------
*/
const toStringValue = (
  value,
  defaultValue = ""
) => {
  const cleanValue = emptyToNull(value)

  if (cleanValue === null) {
    return defaultValue
  }

  return String(cleanValue).trim()
}

/*
|--------------------------------------------------------------------------
| VALIDATE NUMBER MINIMUM ZERO
|--------------------------------------------------------------------------
*/
const validateNumberMinZero = (
  value,
  fieldName
) => {
  if (!Number.isFinite(Number(value))) {
    throw createServiceError(
      `${fieldName} harus berupa angka`,
      422,
      "INVALID_NUMBER"
    )
  }

  if (Number(value) < 0) {
    throw createServiceError(
      `${fieldName} tidak boleh kurang dari 0`,
      422,
      "NUMBER_BELOW_ZERO"
    )
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE INTEGER MINIMUM ZERO
|--------------------------------------------------------------------------
*/
const validateIntegerMinZero = (
  value,
  fieldName
) => {
  validateNumberMinZero(value, fieldName)

  if (!Number.isInteger(Number(value))) {
    throw createServiceError(
      `${fieldName} harus berupa bilangan bulat`,
      422,
      "INVALID_INTEGER"
    )
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE DISCOUNT
|--------------------------------------------------------------------------
*/
const validateDiscount = async (
  id_discount,
  id_store
) => {
  if (!id_discount) {
    return null
  }

  const discount =
    await productModel.findDiscountByIdAndStore(
      id_discount,
      id_store
    )

  if (!discount) {
    throw createServiceError(
      "Diskon tidak ditemukan pada toko ini",
      404,
      "DISCOUNT_NOT_FOUND"
    )
  }

  if (
    discount.status_diskon !== "aktif"
  ) {
    throw createServiceError(
      "Diskon sedang nonaktif",
      403,
      "DISCOUNT_INACTIVE"
    )
  }

  const now = new Date()

  if (
    discount.tanggal_mulai &&
    now < new Date(discount.tanggal_mulai)
  ) {
    throw createServiceError(
      "Diskon belum mulai",
      422,
      "DISCOUNT_NOT_STARTED"
    )
  }

  if (
    discount.tanggal_berakhir &&
    now > new Date(discount.tanggal_berakhir)
  ) {
    throw createServiceError(
      "Diskon sudah berakhir",
      422,
      "DISCOUNT_EXPIRED"
    )
  }

  return discount
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PRODUCT DATA
|--------------------------------------------------------------------------
*/
const normalizeProductData = (
  data = {}
) => {
  return {
    id_store: toId(data.id_store),
    id_category: toId(data.id_category),
    id_discount: toId(data.id_discount),

    kode_produk: toStringValue(
      data.kode_produk
    ),

    barcode: toStringValue(
      data.barcode
    ),

    nama_produk: toStringValue(
      data.nama_produk
    ),

    deskripsi: toStringValue(
      data.deskripsi
    ),

    harga_beli: toNumber(
      data.harga_beli,
      0
    ),

    harga_jual: toNumber(
      data.harga_jual,
      0
    ),

    stok: toNumber(
      data.stok,
      0
    ),

    stok_minimum: toNumber(
      data.stok_minimum,
      0
    ),

    satuan: toStringValue(
      data.satuan,
      "pcs"
    ),

    foto: emptyToNull(data.foto),

    status_produk: toStringValue(
      data.status_produk,
      "aktif"
    )
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE PRODUCT FIELDS
|--------------------------------------------------------------------------
*/
const validateProductFields = (
  product
) => {
  if (!product.kode_produk) {
    throw createServiceError(
      "Kode produk wajib diisi",
      422,
      "PRODUCT_CODE_REQUIRED"
    )
  }

  if (!product.nama_produk) {
    throw createServiceError(
      "Nama produk wajib diisi",
      422,
      "PRODUCT_NAME_REQUIRED"
    )
  }

  if (product.kode_produk.length > 100) {
    throw createServiceError(
      "Kode produk maksimal 100 karakter",
      422,
      "PRODUCT_CODE_TOO_LONG"
    )
  }

  if (
    product.barcode &&
    product.barcode.length > 100
  ) {
    throw createServiceError(
      "Barcode maksimal 100 karakter",
      422,
      "BARCODE_TOO_LONG"
    )
  }

  if (product.nama_produk.length > 150) {
    throw createServiceError(
      "Nama produk maksimal 150 karakter",
      422,
      "PRODUCT_NAME_TOO_LONG"
    )
  }

  if (
    !["aktif", "nonaktif"].includes(
      product.status_produk
    )
  ) {
    throw createServiceError(
      "Status produk hanya boleh aktif atau nonaktif",
      422,
      "INVALID_PRODUCT_STATUS"
    )
  }

  validateNumberMinZero(
    product.harga_beli,
    "Harga beli"
  )

  validateNumberMinZero(
    product.harga_jual,
    "Harga jual"
  )

  validateIntegerMinZero(
    product.stok,
    "Stok"
  )

  validateIntegerMinZero(
    product.stok_minimum,
    "Stok minimum"
  )
}

/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/
const getAllProducts = async (
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (currentUser.role === "owner") {
    return await productModel.findAllByOwner(
      currentUser.id_user
    )
  }

  if (
    ["admin", "kasir"].includes(
      currentUser.role
    )
  ) {
    if (!currentUser.id_store) {
      throw createServiceError(
        "User belum terhubung dengan toko",
        403,
        "USER_STORE_NOT_ASSIGNED"
      )
    }

    return await productModel.findAllByStore(
      currentUser.id_store
    )
  }

  throw createServiceError(
    "Anda tidak memiliki akses ke produk",
    403,
    "FORBIDDEN"
  )
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/
const getProductById = async (
  id_product,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_product) {
    throw createServiceError(
      "ID produk wajib diisi",
      422,
      "PRODUCT_ID_REQUIRED"
    )
  }

  const product =
    await productModel.findById(id_product)

  if (!product) {
    throw createServiceError(
      "Produk tidak ditemukan",
      404,
      "PRODUCT_NOT_FOUND"
    )
  }

  if (currentUser.role === "owner") {
    if (
      Number(product.id_owner) !==
      Number(currentUser.id_user)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke produk ini",
        403,
        "PRODUCT_ACCESS_DENIED"
      )
    }
  } else if (
    ["admin", "kasir"].includes(
      currentUser.role
    )
  ) {
    if (
      Number(product.id_store) !==
      Number(currentUser.id_store)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke produk ini",
        403,
        "PRODUCT_ACCESS_DENIED"
      )
    }
  } else {
    throw createServiceError(
      "Anda tidak memiliki akses ke produk",
      403,
      "FORBIDDEN"
    )
  }

  return product
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT USAGE
|--------------------------------------------------------------------------
*/
const getMyProductUsage = async (
  currentUser
) => {
  validateCurrentUser(currentUser)

  let idOwner = null

  if (currentUser.role === "owner") {
    idOwner = currentUser.id_user
  } else if (
    ["admin", "kasir"].includes(
      currentUser.role
    )
  ) {
    if (!currentUser.id_store) {
      throw createServiceError(
        "User belum terhubung dengan toko",
        403,
        "USER_STORE_NOT_ASSIGNED"
      )
    }

    const productStore =
      await productModel.findAllByStore(
        currentUser.id_store
      )

    // Penggunaan paket sebaiknya hanya ditampilkan kepada owner.
    throw createServiceError(
      "Hanya owner yang dapat melihat penggunaan paket produk",
      403,
      "FORBIDDEN"
    )
  }

  if (!idOwner) {
    throw createServiceError(
      "Anda tidak memiliki akses",
      403,
      "FORBIDDEN"
    )
  }

  const usage =
    await productModel.getProductUsageByOwner(
      idOwner
    )

  if (!usage) {
    throw createServiceError(
      "Tidak ada langganan aktif",
      403,
      "ACTIVE_SUBSCRIPTION_NOT_FOUND"
    )
  }

  return usage
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/
const createProduct = async (
  data = {},
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (
    !["owner", "admin"].includes(
      currentUser.role
    )
  ) {
    throw createServiceError(
      "Hanya owner atau admin yang dapat menambahkan produk",
      403,
      "FORBIDDEN"
    )
  }

  const product =
    normalizeProductData(data)

  validateProductFields(product)

  let finalStoreId = product.id_store

  if (currentUser.role === "owner") {
    if (!finalStoreId) {
      throw createServiceError(
        "ID toko wajib diisi",
        422,
        "STORE_ID_REQUIRED"
      )
    }
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw createServiceError(
        "Admin belum terhubung dengan toko",
        403,
        "ADMIN_STORE_NOT_ASSIGNED"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Abaikan id_store dari body untuk admin.
    |--------------------------------------------------------------------------
    */
    finalStoreId =
      Number(currentUser.id_store)
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE IN TRANSACTION
  |--------------------------------------------------------------------------
  | Model akan memeriksa:
  |
  | - akses toko;
  | - status toko;
  | - akun owner;
  | - langganan aktif;
  | - batas produk;
  | - kategori;
  | - diskon;
  | - kode produk;
  | - barcode.
  |--------------------------------------------------------------------------
  */
  return await productModel.create({
    actor_id: currentUser.id_user,
    actor_role: currentUser.role,
    actor_store_id:
      currentUser.id_store || null,

    id_store: finalStoreId,
    id_category:
      product.id_category || null,
    id_discount:
      product.id_discount || null,

    kode_produk:
      product.kode_produk,

    barcode:
      product.barcode || null,

    nama_produk:
      product.nama_produk,

    deskripsi:
      product.deskripsi || null,

    harga_beli:
      product.harga_beli,

    harga_jual:
      product.harga_jual,

    stok:
      product.stok,

    stok_minimum:
      product.stok_minimum,

    satuan:
      product.satuan || "pcs",

    foto:
      product.foto || null,

    status_produk:
      product.status_produk || "aktif"
  })
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
| Update tidak menambah jumlah produk sehingga tidak perlu memeriksa
| batas_produk.
|--------------------------------------------------------------------------
*/
const updateProduct = async (
  id_product,
  data = {},
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_product) {
    throw createServiceError(
      "ID produk wajib diisi",
      422,
      "PRODUCT_ID_REQUIRED"
    )
  }

  if (
    !["owner", "admin"].includes(
      currentUser.role
    )
  ) {
    throw createServiceError(
      "Hanya owner atau admin yang dapat memperbarui produk",
      403,
      "FORBIDDEN"
    )
  }

  const existingProduct =
    await productModel.findById(id_product)

  if (!existingProduct) {
    throw createServiceError(
      "Produk tidak ditemukan",
      404,
      "PRODUCT_NOT_FOUND"
    )
  }

  const product =
    normalizeProductData(data)

  validateProductFields(product)

  let finalStoreId =
    product.id_store ||
    existingProduct.id_store

  if (currentUser.role === "owner") {
    if (
      Number(existingProduct.id_owner) !==
      Number(currentUser.id_user)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke produk ini",
        403,
        "PRODUCT_ACCESS_DENIED"
      )
    }

    if (!product.id_store) {
      throw createServiceError(
        "ID toko wajib diisi",
        422,
        "STORE_ID_REQUIRED"
      )
    }

    const store =
      await productModel.findStoreByIdAndOwner(
        product.id_store,
        currentUser.id_user
      )

    if (!store) {
      throw createServiceError(
        "Toko tidak ditemukan atau bukan milik owner ini",
        404,
        "STORE_NOT_FOUND"
      )
    }

    if (store.status_toko !== "aktif") {
      throw createServiceError(
        "Toko sedang nonaktif",
        403,
        "STORE_INACTIVE"
      )
    }

    finalStoreId = product.id_store
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw createServiceError(
        "Admin belum terhubung dengan toko",
        403,
        "ADMIN_STORE_NOT_ASSIGNED"
      )
    }

    if (
      Number(existingProduct.id_store) !==
      Number(currentUser.id_store)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke produk ini",
        403,
        "PRODUCT_ACCESS_DENIED"
      )
    }

    finalStoreId =
      Number(currentUser.id_store)
  }

  if (product.id_category) {
    const category =
      await productModel.findCategoryByIdAndStore(
        product.id_category,
        finalStoreId
      )

    if (!category) {
      throw createServiceError(
        "Kategori tidak ditemukan pada toko ini",
        404,
        "CATEGORY_NOT_FOUND"
      )
    }

    if (
      category.status_kategori !== "aktif"
    ) {
      throw createServiceError(
        "Kategori sedang nonaktif",
        403,
        "CATEGORY_INACTIVE"
      )
    }
  }

  await validateDiscount(
    product.id_discount,
    finalStoreId
  )

  const codeExists =
    await productModel.findByKodeAndStore(
      product.kode_produk,
      finalStoreId
    )

  if (
    codeExists &&
    Number(codeExists.id_product) !==
      Number(id_product)
  ) {
    throw createServiceError(
      "Kode produk sudah digunakan pada toko ini",
      409,
      "PRODUCT_CODE_ALREADY_EXISTS"
    )
  }

  if (product.barcode) {
    const barcodeExists =
      await productModel.findByBarcodeAndStore(
        product.barcode,
        finalStoreId
      )

    if (
      barcodeExists &&
      Number(barcodeExists.id_product) !==
        Number(id_product)
    ) {
      throw createServiceError(
        "Barcode sudah digunakan pada toko ini",
        409,
        "PRODUCT_BARCODE_ALREADY_EXISTS"
      )
    }
  }

  const updated =
    await productModel.update(
      id_product,
      {
        id_store: finalStoreId,

        id_category:
          product.id_category || null,

        id_discount:
          product.id_discount || null,

        kode_produk:
          product.kode_produk,

        barcode:
          product.barcode || null,

        nama_produk:
          product.nama_produk,

        deskripsi:
          product.deskripsi || null,

        harga_beli:
          product.harga_beli,

        harga_jual:
          product.harga_jual,

        stok:
          product.stok,

        stok_minimum:
          product.stok_minimum,

        satuan:
          product.satuan || "pcs",

        foto:
          product.foto ||
          existingProduct.foto ||
          null,

        status_produk:
          product.status_produk
      }
    )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui produk",
      500,
      "PRODUCT_UPDATE_FAILED"
    )
  }

  return await productModel.findById(
    id_product
  )
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT PHOTO
|--------------------------------------------------------------------------
*/
const updateProductFoto = async (
  id_product,
  foto,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_product) {
    throw createServiceError(
      "ID produk wajib diisi",
      422,
      "PRODUCT_ID_REQUIRED"
    )
  }

  if (!foto) {
    throw createServiceError(
      "Foto produk wajib diisi",
      422,
      "PRODUCT_PHOTO_REQUIRED"
    )
  }

  if (
    !["owner", "admin"].includes(
      currentUser.role
    )
  ) {
    throw createServiceError(
      "Hanya owner atau admin yang dapat memperbarui foto produk",
      403,
      "FORBIDDEN"
    )
  }

  const product =
    await productModel.findById(id_product)

  if (!product) {
    throw createServiceError(
      "Produk tidak ditemukan",
      404,
      "PRODUCT_NOT_FOUND"
    )
  }

  if (
    currentUser.role === "owner" &&
    Number(product.id_owner) !==
      Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke produk ini",
      403,
      "PRODUCT_ACCESS_DENIED"
    )
  }

  if (
    currentUser.role === "admin" &&
    Number(product.id_store) !==
      Number(currentUser.id_store)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke produk ini",
      403,
      "PRODUCT_ACCESS_DENIED"
    )
  }

  const updated =
    await productModel.updateFoto(
      id_product,
      foto
    )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui foto produk",
      500,
      "PRODUCT_PHOTO_UPDATE_FAILED"
    )
  }

  return await productModel.findById(
    id_product
  )
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/
const deleteProduct = async (
  id_product,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_product) {
    throw createServiceError(
      "ID produk wajib diisi",
      422,
      "PRODUCT_ID_REQUIRED"
    )
  }

  if (
    !["owner", "admin"].includes(
      currentUser.role
    )
  ) {
    throw createServiceError(
      "Hanya owner atau admin yang dapat menghapus produk",
      403,
      "FORBIDDEN"
    )
  }

  const product =
    await productModel.findById(id_product)

  if (!product) {
    throw createServiceError(
      "Produk tidak ditemukan",
      404,
      "PRODUCT_NOT_FOUND"
    )
  }

  if (
    currentUser.role === "owner" &&
    Number(product.id_owner) !==
      Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke produk ini",
      403,
      "PRODUCT_ACCESS_DENIED"
    )
  }

  if (
    currentUser.role === "admin" &&
    Number(product.id_store) !==
      Number(currentUser.id_store)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke produk ini",
      403,
      "PRODUCT_ACCESS_DENIED"
    )
  }

  const deleted =
    await productModel.remove(id_product)

  if (!deleted) {
    throw createServiceError(
      "Gagal menghapus produk",
      500,
      "PRODUCT_DELETE_FAILED"
    )
  }

  return {
    id_product: Number(id_product),
    pesan: "Produk berhasil dihapus"
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getMyProductUsage,
  createProduct,
  updateProduct,
  updateProductFoto,
  deleteProduct
}