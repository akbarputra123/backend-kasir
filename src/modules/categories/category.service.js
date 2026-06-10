const categoryModel = require("./category.model")

/*
|--------------------------------------------------------------------------
| GET ALL CATEGORIES
|--------------------------------------------------------------------------
*/
const getAllCategories = async (currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await categoryModel.findAllByOwner(currentUser.id_user)
  }

  if (["admin", "kasir"].includes(currentUser.role)) {
    if (!currentUser.id_store) {
      throw new Error("User belum terhubung dengan toko")
    }

    return await categoryModel.findAllByStore(currentUser.id_store)
  }

  throw new Error("Anda tidak memiliki akses ke kategori")
}

/*
|--------------------------------------------------------------------------
| GET CATEGORY BY ID
|--------------------------------------------------------------------------
*/
const getCategoryById = async (id_category, currentUser) => {
  if (!id_category) {
    throw new Error("ID kategori wajib diisi")
  }

  const category = await categoryModel.findById(id_category)

  if (!category) {
    throw new Error("Kategori tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(category.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke kategori ini")
    }
  } else if (["admin", "kasir"].includes(currentUser.role)) {
    if (Number(category.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke kategori ini")
    }
  } else {
    throw new Error("Anda tidak memiliki akses ke kategori")
  }

  return category
}

/*
|--------------------------------------------------------------------------
| CREATE CATEGORY
|--------------------------------------------------------------------------
| Owner/admin bisa membuat kategori.
|--------------------------------------------------------------------------
*/
const createCategory = async (data, currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menambahkan kategori")
  }

  const {
    id_store,
    nama_kategori,
    deskripsi,
    status_kategori
  } = data

  if (!nama_kategori) {
    throw new Error("Nama kategori wajib diisi")
  }

  if (status_kategori && !["aktif", "nonaktif"].includes(status_kategori)) {
    throw new Error("Status kategori hanya boleh aktif atau nonaktif")
  }

  let finalStoreId = id_store

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    const store = await categoryModel.findStoreByIdAndOwner(
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

  const categoryExists = await categoryModel.findByNameAndStore(
    nama_kategori,
    finalStoreId
  )

  if (categoryExists) {
    throw new Error("Nama kategori sudah digunakan pada toko ini")
  }

  return await categoryModel.create({
    id_store: finalStoreId,
    nama_kategori,
    deskripsi,
    status_kategori: status_kategori || "aktif"
  })
}

/*
|--------------------------------------------------------------------------
| UPDATE CATEGORY
|--------------------------------------------------------------------------
*/
const updateCategory = async (id_category, data, currentUser) => {
  if (!id_category) {
    throw new Error("ID kategori wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat memperbarui kategori")
  }

  const category = await categoryModel.findById(id_category)

  if (!category) {
    throw new Error("Kategori tidak ditemukan")
  }

  const {
    id_store,
    nama_kategori,
    deskripsi,
    status_kategori
  } = data

  if (!nama_kategori || !status_kategori) {
    throw new Error("Nama kategori dan status kategori wajib diisi")
  }

  if (!["aktif", "nonaktif"].includes(status_kategori)) {
    throw new Error("Status kategori hanya boleh aktif atau nonaktif")
  }

  let finalStoreId = id_store || category.id_store

  if (currentUser.role === "owner") {
    if (!id_store) {
      throw new Error("ID toko wajib diisi")
    }

    if (Number(category.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke kategori ini")
    }

    const store = await categoryModel.findStoreByIdAndOwner(
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
    if (Number(category.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke kategori ini")
    }

    finalStoreId = currentUser.id_store
  }

  const categoryExists = await categoryModel.findByNameAndStore(
    nama_kategori,
    finalStoreId
  )

  if (
    categoryExists &&
    Number(categoryExists.id_category) !== Number(id_category)
  ) {
    throw new Error("Nama kategori sudah digunakan pada toko ini")
  }

  const updated = await categoryModel.update(id_category, {
    id_store: finalStoreId,
    nama_kategori,
    deskripsi,
    status_kategori
  })

  if (!updated) {
    throw new Error("Gagal memperbarui kategori")
  }

  return await categoryModel.findById(id_category)
}

/*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
*/
const deleteCategory = async (id_category, currentUser) => {
  if (!id_category) {
    throw new Error("ID kategori wajib diisi")
  }

  if (!["owner", "admin"].includes(currentUser.role)) {
    throw new Error("Hanya owner atau admin yang dapat menghapus kategori")
  }

  const category = await categoryModel.findById(id_category)

  if (!category) {
    throw new Error("Kategori tidak ditemukan")
  }

  if (currentUser.role === "owner") {
    if (Number(category.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke kategori ini")
    }
  }

  if (currentUser.role === "admin") {
    if (Number(category.id_store) !== Number(currentUser.id_store)) {
      throw new Error("Anda tidak memiliki akses ke kategori ini")
    }
  }

  const totalProducts = await categoryModel.countProductsByCategory(id_category)

  if (totalProducts > 0) {
    throw new Error("Kategori tidak dapat dihapus karena masih digunakan oleh produk")
  }

  const deleted = await categoryModel.remove(id_category)

  if (!deleted) {
    throw new Error("Gagal menghapus kategori")
  }

  return {
    id_category: Number(id_category),
    pesan: "Kategori berhasil dihapus"
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}