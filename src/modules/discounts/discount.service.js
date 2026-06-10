const discountModel = require("./discount.model")

/*
|--------------------------------------------------------------------------
| VALIDATE DISCOUNT DATA
|--------------------------------------------------------------------------
*/
const validateDiscountData = (data) => {
  const {
    nama_diskon,
    tipe_diskon,
    nilai_diskon,
    tanggal_mulai,
    tanggal_berakhir,
    status_diskon
  } = data

  if (!nama_diskon) {
    throw new Error("Nama diskon wajib diisi")
  }

  if (!tipe_diskon) {
    throw new Error("Tipe diskon wajib diisi")
  }

  if (!["nominal", "persen"].includes(tipe_diskon)) {
    throw new Error("Tipe diskon hanya boleh nominal atau persen")
  }

  if (nilai_diskon === undefined || nilai_diskon === null || nilai_diskon === "") {
    throw new Error("Nilai diskon wajib diisi")
  }

  if (Number(nilai_diskon) < 0) {
    throw new Error("Nilai diskon tidak boleh kurang dari 0")
  }

  if (tipe_diskon === "persen" && Number(nilai_diskon) > 100) {
    throw new Error("Diskon persen tidak boleh lebih dari 100")
  }

  if (status_diskon && !["aktif", "nonaktif"].includes(status_diskon)) {
    throw new Error("Status diskon hanya boleh aktif atau nonaktif")
  }

  if (tanggal_mulai && tanggal_berakhir) {
    const mulai = new Date(tanggal_mulai)
    const berakhir = new Date(tanggal_berakhir)

    if (mulai > berakhir) {
      throw new Error("Tanggal mulai tidak boleh lebih besar dari tanggal berakhir")
    }
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL DISCOUNTS
|--------------------------------------------------------------------------
*/
const getAllDiscounts = async (currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await discountModel.findAllByOwner(currentUser.id_user)
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (!currentUser.id_store) {
      throw new Error("User belum terhubung dengan toko")
    }

    return await discountModel.findAllByStore(currentUser.id_store)
  }

  throw new Error("Anda tidak memiliki akses ke diskon")
}

/*
|--------------------------------------------------------------------------
| GET DISCOUNT BY ID
|--------------------------------------------------------------------------
*/
const getDiscountById = async (id_discount, currentUser) => {
  if (!id_discount) {
    throw new Error("ID diskon wajib diisi")
  }

  const discount = await discountModel.findById(id_discount)

  if (!discount) {
    throw new Error("Diskon tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(discount.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke diskon ini")
    }
  } else if (["admin", "kasir"].includes(currentUser.role)) {
    if (Number(discount.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke diskon ini")
    }
  } else {
    throw new Error("Anda tidak memiliki akses ke diskon")
  }

  return discount
}

/*
|--------------------------------------------------------------------------
| CREATE DISCOUNT
|--------------------------------------------------------------------------
*/
const createDiscount = async (data, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menambahkan diskon")
  }

  validateDiscountData(data)

  const {
    id_store,
    nama_diskon,
    tipe_diskon,
    nilai_diskon,
    tanggal_mulai,
    tanggal_berakhir,
    status_diskon
  } = data

  let finalStoreId = id_store

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    const store = await discountModel.findStoreByIdAndOwner(
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

  const discountExists = await discountModel.findByNameAndStore(
    nama_diskon,
    finalStoreId
  )

  if (discountExists) {
    throw new Error("Nama diskon sudah digunakan pada toko ini")
  }

  return await discountModel.create({
    id_store: finalStoreId,
    nama_diskon,
    tipe_diskon,
    nilai_diskon: Number(nilai_diskon),
    tanggal_mulai,
    tanggal_berakhir,
    status_diskon: status_diskon || "aktif"
  })
}

/*
|--------------------------------------------------------------------------
| UPDATE DISCOUNT
|--------------------------------------------------------------------------
*/
const updateDiscount = async (id_discount, data, currentUser) => {
  if (!id_discount) {
    throw new Error("ID diskon wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat memperbarui diskon")
  }

  validateDiscountData(data)

  const discount = await discountModel.findById(id_discount)

  if (!discount) {
    throw new Error("Diskon tidak ditemukan")
  }

  const {
    id_store,
    nama_diskon,
    tipe_diskon,
    nilai_diskon,
    tanggal_mulai,
    tanggal_berakhir,
    status_diskon
  } = data

  let finalStoreId = id_store || discount.id_store

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    if (Number(discount.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke diskon ini")
    }

    const store = await discountModel.findStoreByIdAndOwner(
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
    if (Number(discount.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke diskon ini")
    }

    finalStoreId = currentUser.id_store
  }

  const discountExists = await discountModel.findByNameAndStore(
    nama_diskon,
    finalStoreId
  )

  if (
    discountExists &&
    Number(discountExists.id_discount) !== Number(id_discount)
  ) {
    throw new Error("Nama diskon sudah digunakan pada toko ini")
  }

  const updated = await discountModel.update(id_discount, {
    id_store: finalStoreId,
    nama_diskon,
    tipe_diskon,
    nilai_diskon: Number(nilai_diskon),
    tanggal_mulai,
    tanggal_berakhir,
    status_diskon
  })

  if (!updated) {
    throw new Error("Gagal memperbarui diskon")
  }

  return await discountModel.findById(id_discount)
}

/*
|--------------------------------------------------------------------------
| DELETE DISCOUNT
|--------------------------------------------------------------------------
*/
const deleteDiscount = async (id_discount, currentUser) => {
  if (!id_discount) {
    throw new Error("ID diskon wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menghapus diskon")
  }

  const discount = await discountModel.findById(id_discount)

  if (!discount) {
    throw new Error("Diskon tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(discount.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke diskon ini")
    }
  }

  if (currentUser.role === "admin") {
    if (Number(discount.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke diskon ini")
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CATATAN
  |--------------------------------------------------------------------------
  | Agar tidak error foreign key, diskon dilepas dulu dari produk,
  | lalu data diskon dihapus.
  |--------------------------------------------------------------------------
  */
  await discountModel.detachFromProducts(id_discount)

  const deleted = await discountModel.remove(id_discount)

  if (!deleted) {
    throw new Error("Gagal menghapus diskon")
  }

  return {
    id_discount: Number(id_discount),
    pesan: "Diskon berhasil dihapus"
  }
}

/*
|--------------------------------------------------------------------------
| DEACTIVATE DISCOUNT
|--------------------------------------------------------------------------
| Alternatif aman: diskon tidak dihapus, hanya dinonaktifkan.
|--------------------------------------------------------------------------
*/
const deactivateDiscount = async (id_discount, currentUser) => {
  const discount = await getDiscountById(id_discount, currentUser)

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menonaktifkan diskon")
  }

  const updated = await discountModel.update(id_discount, {
    id_store: discount.id_store,
    nama_diskon: discount.nama_diskon,
    tipe_diskon: discount.tipe_diskon,
    nilai_diskon: Number(discount.nilai_diskon),
    tanggal_mulai: discount.tanggal_mulai,
    tanggal_berakhir: discount.tanggal_berakhir,
    status_diskon: "nonaktif"
  })

  if (!updated) {
    throw new Error("Gagal menonaktifkan diskon")
  }

  return await discountModel.findById(id_discount)
}

module.exports = {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  deactivateDiscount
}