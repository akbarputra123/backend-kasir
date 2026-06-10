const storeModel = require("./store.model")

/*
|--------------------------------------------------------------------------
| VALIDATE PPN
|--------------------------------------------------------------------------
*/
const validatePpn = (ppn_aktif, ppn_persen) => {
  const finalPpnAktif = ppn_aktif || "tidak"
  const finalPpnPersen = Number(ppn_persen || 0)

  if (!["ya", "tidak"].includes(finalPpnAktif)) {
    throw new Error("PPN aktif hanya boleh ya atau tidak")
  }

  if (finalPpnPersen < 0) {
    throw new Error("PPN persen tidak boleh kurang dari 0")
  }

  if (finalPpnPersen > 100) {
    throw new Error("PPN persen tidak boleh lebih dari 100")
  }

  if (finalPpnAktif === "tidak" && finalPpnPersen > 0) {
    throw new Error("Jika PPN tidak aktif, nilai PPN harus 0")
  }

  return {
    ppn_aktif: finalPpnAktif,
    ppn_persen: finalPpnAktif === "ya" ? finalPpnPersen : 0
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL STORES
|--------------------------------------------------------------------------
| Owner bisa melihat semua toko.
|--------------------------------------------------------------------------
*/
const getAllStores = async () => {
  return await storeModel.findAll()
}

/*
|--------------------------------------------------------------------------
| GET STORE BY ID
|--------------------------------------------------------------------------
| Mengambil detail toko berdasarkan id_store.
|--------------------------------------------------------------------------
*/
const getStoreById = async (id_store) => {
  if (!id_store) {
    throw new Error("ID toko wajib diisi")
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw new Error("Toko tidak ditemukan")
  }

  return store
}

/*
|--------------------------------------------------------------------------
| GET MY STORES
|--------------------------------------------------------------------------
| Mengambil toko berdasarkan owner yang sedang login.
|--------------------------------------------------------------------------
*/
const getMyStores = async (currentUser) => {
  if (!currentUser || !currentUser.id_user) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await storeModel.findByOwnerId(currentUser.id_user)
  }

  if (!currentUser.id_store) {
    throw new Error("User belum terhubung dengan toko")
  }

  const store = await storeModel.findById(currentUser.id_store)

  if (!store) {
    throw new Error("Toko tidak ditemukan")
  }

  return [store]
}

/*
|--------------------------------------------------------------------------
| CREATE STORE
|--------------------------------------------------------------------------
| Owner membuat toko baru.
|--------------------------------------------------------------------------
*/
const createStore = async (data, currentUser) => {
  if (!currentUser || !currentUser.id_user) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat membuat toko")
  }

  const {
    nama_toko,
    alamat,
    no_hp,
    email,
    logo,
    status_toko,
    ppn_aktif,
    ppn_persen
  } = data

  if (!nama_toko) {
    throw new Error("Nama toko wajib diisi")
  }

  if (status_toko && !["aktif", "nonaktif"].includes(status_toko)) {
    throw new Error("Status toko hanya boleh aktif atau nonaktif")
  }

  const ppn = validatePpn(ppn_aktif, ppn_persen)

  const storeExists = await storeModel.findByNameAndOwner(
    nama_toko,
    currentUser.id_user
  )

  if (storeExists) {
    throw new Error("Nama toko sudah digunakan")
  }

  const store = await storeModel.create({
    id_owner: currentUser.id_user,
    nama_toko,
    alamat,
    no_hp,
    email,
    logo,
    status_toko: status_toko || "aktif",
    ppn_aktif: ppn.ppn_aktif,
    ppn_persen: ppn.ppn_persen
  })

  /*
  |--------------------------------------------------------------------------
  | HUBUNGKAN OWNER KE TOKO PERTAMA
  |--------------------------------------------------------------------------
  | Jika owner belum punya id_store, maka toko pertama akan langsung dijadikan
  | toko aktif milik owner.
  |--------------------------------------------------------------------------
  */
  if (!currentUser.id_store) {
    await storeModel.assignStoreToUser(
      currentUser.id_user,
      store.id_store
    )
  }

  return store
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE
|--------------------------------------------------------------------------
| Owner memperbarui data toko.
|--------------------------------------------------------------------------
*/
const updateStore = async (id_store, data, currentUser) => {
  if (!id_store) {
    throw new Error("ID toko wajib diisi")
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw new Error("Toko tidak ditemukan")
  }

  if (currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat memperbarui toko")
  }

  if (Number(store.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke toko ini")
  }

  const {
    nama_toko,
    alamat,
    no_hp,
    email,
    logo,
    status_toko,
    ppn_aktif,
    ppn_persen
  } = data

  if (!nama_toko) {
    throw new Error("Nama toko wajib diisi")
  }

  if (!status_toko) {
    throw new Error("Status toko wajib diisi")
  }

  if (!["aktif", "nonaktif"].includes(status_toko)) {
    throw new Error("Status toko hanya boleh aktif atau nonaktif")
  }

  const ppn = validatePpn(ppn_aktif, ppn_persen)

  const storeNameExists = await storeModel.findByNameAndOwner(
    nama_toko,
    currentUser.id_user
  )

  if (
    storeNameExists &&
    Number(storeNameExists.id_store) !== Number(id_store)
  ) {
    throw new Error("Nama toko sudah digunakan")
  }

  const updated = await storeModel.update(id_store, {
    nama_toko,
    alamat,
    no_hp,
    email,
    logo: logo || store.logo,
    status_toko,
    ppn_aktif: ppn.ppn_aktif,
    ppn_persen: ppn.ppn_persen
  })

  if (!updated) {
    throw new Error("Gagal memperbarui toko")
  }

  return await storeModel.findById(id_store)
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO
|--------------------------------------------------------------------------
| Memperbarui logo toko.
|--------------------------------------------------------------------------
*/
const updateStoreLogo = async (id_store, logo, currentUser) => {
  if (!id_store) {
    throw new Error("ID toko wajib diisi")
  }

  if (!logo) {
    throw new Error("Logo toko wajib diisi")
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw new Error("Toko tidak ditemukan")
  }

  if (currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat memperbarui logo toko")
  }

  if (Number(store.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke toko ini")
  }

  const updated = await storeModel.updateLogo(id_store, logo)

  if (!updated) {
    throw new Error("Gagal memperbarui logo toko")
  }

  return await storeModel.findById(id_store)
}

/*
|--------------------------------------------------------------------------
| DELETE STORE
|--------------------------------------------------------------------------
| Owner menghapus toko.
|--------------------------------------------------------------------------
*/
const deleteStore = async (id_store, currentUser) => {
  if (!id_store) {
    throw new Error("ID toko wajib diisi")
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw new Error("Toko tidak ditemukan")
  }

  if (currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat menghapus toko")
  }

  if (Number(store.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke toko ini")
  }

  const deleted = await storeModel.remove(id_store)

  if (!deleted) {
    throw new Error("Gagal menghapus toko")
  }

  return {
    id_store: Number(id_store),
    pesan: "Toko berhasil dihapus"
  }
}

module.exports = {
  getAllStores,
  getStoreById,
  getMyStores,
  createStore,
  updateStore,
  updateStoreLogo,
  deleteStore
}