const stockLogModel = require("./stockLog.model")

/*
|--------------------------------------------------------------------------
| CHECK PRODUCT ACCESS
|--------------------------------------------------------------------------
*/
const checkProductAccess = async (id_product, currentUser) => {
  const product = await stockLogModel.findProductById(id_product)

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
    throw new Error("Anda tidak memiliki akses ke produk ini")
  }

  return product
}

/*
|--------------------------------------------------------------------------
| GET ALL STOCK LOGS
|--------------------------------------------------------------------------
*/
const getAllStockLogs = async (currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await stockLogModel.findAllByOwner(currentUser.id_user)
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (!currentUser.id_store) {
      throw new Error("User belum terhubung dengan toko")
    }

    return await stockLogModel.findAllByStore(currentUser.id_store)
  }

  throw new Error("Anda tidak memiliki akses ke riwayat stok")
}

/*
|--------------------------------------------------------------------------
| GET STOCK LOGS BY PRODUCT
|--------------------------------------------------------------------------
*/
const getStockLogsByProduct = async (id_product, currentUser) => {
  if (!id_product) {
    throw new Error("ID produk wajib diisi")
  }

  await checkProductAccess(id_product, currentUser)

  return await stockLogModel.findByProduct(id_product)
}

/*
|--------------------------------------------------------------------------
| STOCK IN
|--------------------------------------------------------------------------
*/
const stockIn = async (data, currentUser) => {
  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menambah stok")
  }

  const { id_product, jumlah, keterangan } = data

  if (!id_product || !jumlah) {
    throw new Error("ID produk dan jumlah wajib diisi")
  }

  if (Number(jumlah) <= 0) {
    throw new Error("Jumlah stok masuk harus lebih dari 0")
  }

  const product = await checkProductAccess(id_product, currentUser)

  if (product.status_produk !== "aktif") {
    throw new Error("Produk sedang nonaktif")
  }

  return await stockLogModel.changeStock({
    id_product,
    id_user: currentUser.id_user,
    tipe: "masuk",
    jumlah: Number(jumlah),
    keterangan: keterangan || "Stok masuk"
  })
}

/*
|--------------------------------------------------------------------------
| STOCK OUT
|--------------------------------------------------------------------------
*/
const stockOut = async (data, currentUser) => {
  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat mengurangi stok manual")
  }

  const { id_product, jumlah, keterangan } = data

  if (!id_product || !jumlah) {
    throw new Error("ID produk dan jumlah wajib diisi")
  }

  if (Number(jumlah) <= 0) {
    throw new Error("Jumlah stok keluar harus lebih dari 0")
  }

  const product = await checkProductAccess(id_product, currentUser)

  if (product.status_produk !== "aktif") {
    throw new Error("Produk sedang nonaktif")
  }

  if (Number(product.stok) < Number(jumlah)) {
    throw new Error("Stok tidak mencukupi")
  }

  return await stockLogModel.changeStock({
    id_product,
    id_user: currentUser.id_user,
    tipe: "keluar",
    jumlah: Number(jumlah),
    keterangan: keterangan || "Stok keluar manual"
  })
}

/*
|--------------------------------------------------------------------------
| STOCK ADJUSTMENT
|--------------------------------------------------------------------------
| Mengubah stok ke angka final tertentu.
|--------------------------------------------------------------------------
*/
const stockAdjustment = async (data, currentUser) => {
  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menyesuaikan stok")
  }

  const { id_product, stok_baru, keterangan } = data

  if (!id_product && id_product !== 0) {
    throw new Error("ID produk wajib diisi")
  }

  if (stok_baru === undefined || stok_baru === null || stok_baru === "") {
    throw new Error("Stok baru wajib diisi")
  }

  if (Number(stok_baru) < 0) {
    throw new Error("Stok baru tidak boleh kurang dari 0")
  }

  const product = await checkProductAccess(id_product, currentUser)

  if (product.status_produk !== "aktif") {
    throw new Error("Produk sedang nonaktif")
  }

  return await stockLogModel.changeStock({
    id_product,
    id_user: currentUser.id_user,
    tipe: "penyesuaian",
    stok_baru: Number(stok_baru),
    jumlah: Math.abs(Number(stok_baru) - Number(product.stok)),
    keterangan: keterangan || "Penyesuaian stok"
  })
}

module.exports = {
  getAllStockLogs,
  getStockLogsByProduct,
  stockIn,
  stockOut,
  stockAdjustment
}