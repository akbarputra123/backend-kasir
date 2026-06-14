const storeModel = require("./store.model")

/*
|--------------------------------------------------------------------------
| CREATE SERVICE ERROR
|--------------------------------------------------------------------------
*/
const createServiceError = (
  message,
  statusCode = 400,
  code = "STORE_SERVICE_ERROR",
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
| VALIDATE EMAIL
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  if (!email) {
    return null
  }

  const finalEmail = String(email)
    .trim()
    .toLowerCase()

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(finalEmail)) {
    throw createServiceError(
      "Format email toko tidak valid",
      422,
      "INVALID_STORE_EMAIL"
    )
  }

  return finalEmail
}

/*
|--------------------------------------------------------------------------
| VALIDATE PPN
|--------------------------------------------------------------------------
*/
const validatePpn = (ppn_aktif, ppn_persen) => {
  const finalPpnAktif = ppn_aktif || "tidak"
  const finalPpnPersen = Number(ppn_persen || 0)

  if (!["ya", "tidak"].includes(finalPpnAktif)) {
    throw createServiceError(
      "PPN aktif hanya boleh ya atau tidak",
      422,
      "INVALID_PPN_STATUS"
    )
  }

  if (!Number.isFinite(finalPpnPersen)) {
    throw createServiceError(
      "PPN persen harus berupa angka",
      422,
      "INVALID_PPN_PERCENTAGE"
    )
  }

  if (finalPpnPersen < 0) {
    throw createServiceError(
      "PPN persen tidak boleh kurang dari 0",
      422,
      "INVALID_PPN_PERCENTAGE"
    )
  }

  if (finalPpnPersen > 100) {
    throw createServiceError(
      "PPN persen tidak boleh lebih dari 100",
      422,
      "INVALID_PPN_PERCENTAGE"
    )
  }

  if (
    finalPpnAktif === "tidak" &&
    finalPpnPersen > 0
  ) {
    throw createServiceError(
      "Jika PPN tidak aktif, nilai PPN harus 0",
      422,
      "INVALID_PPN_CONFIGURATION"
    )
  }

  return {
    ppn_aktif: finalPpnAktif,
    ppn_persen:
      finalPpnAktif === "ya"
        ? finalPpnPersen
        : 0
  }
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
| GET ALL STORES
|--------------------------------------------------------------------------
*/
const getAllStores = async (currentUser = null) => {
  if (currentUser) {
    validateCurrentUser(currentUser)

    if (currentUser.role !== "owner") {
      throw createServiceError(
        "Hanya owner yang dapat melihat semua toko",
        403,
        "FORBIDDEN"
      )
    }
  }

  return await storeModel.findAll()
}

/*
|--------------------------------------------------------------------------
| GET STORE BY ID
|--------------------------------------------------------------------------
*/
const getStoreById = async (
  id_store,
  currentUser = null
) => {
  if (!id_store) {
    throw createServiceError(
      "ID toko wajib diisi",
      422,
      "STORE_ID_REQUIRED"
    )
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan",
      404,
      "STORE_NOT_FOUND"
    )
  }

  if (currentUser) {
    validateCurrentUser(currentUser)

    if (
      currentUser.role === "owner" &&
      Number(store.id_owner) !==
        Number(currentUser.id_user)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke toko ini",
        403,
        "STORE_ACCESS_DENIED"
      )
    }

    if (
      currentUser.role !== "owner" &&
      Number(currentUser.id_store) !==
        Number(store.id_store)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke toko ini",
        403,
        "STORE_ACCESS_DENIED"
      )
    }
  }

  return store
}

/*
|--------------------------------------------------------------------------
| GET MY STORES
|--------------------------------------------------------------------------
*/
const getMyStores = async (currentUser) => {
  validateCurrentUser(currentUser)

  if (currentUser.role === "owner") {
    return await storeModel.findByOwnerId(
      currentUser.id_user
    )
  }

  if (!currentUser.id_store) {
    throw createServiceError(
      "User belum terhubung dengan toko",
      403,
      "USER_STORE_NOT_ASSIGNED"
    )
  }

  const store = await storeModel.findById(
    currentUser.id_store
  )

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan",
      404,
      "STORE_NOT_FOUND"
    )
  }

  return [store]
}

/*
|--------------------------------------------------------------------------
| GET MY STORE USAGE
|--------------------------------------------------------------------------
| Menampilkan penggunaan batas toko pada paket owner.
|--------------------------------------------------------------------------
*/
const getMyStoreUsage = async (currentUser) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat melihat penggunaan paket",
      403,
      "FORBIDDEN"
    )
  }

  const usage =
    await storeModel.getStoreUsageByOwner(
      currentUser.id_user
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
| CREATE STORE
|--------------------------------------------------------------------------
| Pengecekan batas toko dilakukan langsung di model dalam transaction.
|--------------------------------------------------------------------------
*/
const createStore = async (data, currentUser) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat membuat toko",
      403,
      "FORBIDDEN"
    )
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

  const finalNamaToko =
    String(nama_toko || "").trim()

  if (!finalNamaToko) {
    throw createServiceError(
      "Nama toko wajib diisi",
      422,
      "STORE_NAME_REQUIRED"
    )
  }

  if (finalNamaToko.length > 150) {
    throw createServiceError(
      "Nama toko maksimal 150 karakter",
      422,
      "STORE_NAME_TOO_LONG"
    )
  }

  const finalStatusToko =
    status_toko || "aktif"

  if (
    !["aktif", "nonaktif"].includes(
      finalStatusToko
    )
  ) {
    throw createServiceError(
      "Status toko hanya boleh aktif atau nonaktif",
      422,
      "INVALID_STORE_STATUS"
    )
  }

  const finalNoHp = no_hp
    ? String(no_hp).trim()
    : null

  if (finalNoHp && finalNoHp.length > 20) {
    throw createServiceError(
      "Nomor HP maksimal 20 karakter",
      422,
      "STORE_PHONE_TOO_LONG"
    )
  }

  const finalEmail = validateEmail(email)
  const ppn = validatePpn(ppn_aktif, ppn_persen)

  /*
  |--------------------------------------------------------------------------
  | Tidak perlu findByNameAndOwner dan countByOwner di service.
  |--------------------------------------------------------------------------
  | Pemeriksaan dilakukan ulang di dalam transaction model sehingga aman dari
  | request bersamaan.
  |--------------------------------------------------------------------------
  */
  return await storeModel.create({
    id_owner: currentUser.id_user,
    nama_toko: finalNamaToko,
    alamat: alamat
      ? String(alamat).trim()
      : null,
    no_hp: finalNoHp,
    email: finalEmail,
    logo: logo || null,
    status_toko: finalStatusToko,
    ppn_aktif: ppn.ppn_aktif,
    ppn_persen: ppn.ppn_persen
  })
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE
|--------------------------------------------------------------------------
*/
const updateStore = async (
  id_store,
  data,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_store) {
    throw createServiceError(
      "ID toko wajib diisi",
      422,
      "STORE_ID_REQUIRED"
    )
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan",
      404,
      "STORE_NOT_FOUND"
    )
  }

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat memperbarui toko",
      403,
      "FORBIDDEN"
    )
  }

  if (
    Number(store.id_owner) !==
    Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke toko ini",
      403,
      "STORE_ACCESS_DENIED"
    )
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

  const finalNamaToko =
    String(nama_toko || "").trim()

  if (!finalNamaToko) {
    throw createServiceError(
      "Nama toko wajib diisi",
      422,
      "STORE_NAME_REQUIRED"
    )
  }

  if (finalNamaToko.length > 150) {
    throw createServiceError(
      "Nama toko maksimal 150 karakter",
      422,
      "STORE_NAME_TOO_LONG"
    )
  }

  if (!status_toko) {
    throw createServiceError(
      "Status toko wajib diisi",
      422,
      "STORE_STATUS_REQUIRED"
    )
  }

  if (
    !["aktif", "nonaktif"].includes(status_toko)
  ) {
    throw createServiceError(
      "Status toko hanya boleh aktif atau nonaktif",
      422,
      "INVALID_STORE_STATUS"
    )
  }

  const finalNoHp = no_hp
    ? String(no_hp).trim()
    : null

  if (finalNoHp && finalNoHp.length > 20) {
    throw createServiceError(
      "Nomor HP maksimal 20 karakter",
      422,
      "STORE_PHONE_TOO_LONG"
    )
  }

  const finalEmail = validateEmail(email)
  const ppn = validatePpn(ppn_aktif, ppn_persen)

  const storeNameExists =
    await storeModel.findByNameAndOwner(
      finalNamaToko,
      currentUser.id_user
    )

  if (
    storeNameExists &&
    Number(storeNameExists.id_store) !==
      Number(id_store)
  ) {
    throw createServiceError(
      "Nama toko sudah digunakan",
      409,
      "STORE_NAME_ALREADY_EXISTS"
    )
  }

  const updated = await storeModel.update(
    id_store,
    {
      nama_toko: finalNamaToko,
      alamat: alamat
        ? String(alamat).trim()
        : null,
      no_hp: finalNoHp,
      email: finalEmail,
      logo: logo || store.logo,
      status_toko,
      ppn_aktif: ppn.ppn_aktif,
      ppn_persen: ppn.ppn_persen
    }
  )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui toko",
      500,
      "STORE_UPDATE_FAILED"
    )
  }

  return await storeModel.findById(id_store)
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO
|--------------------------------------------------------------------------
*/
const updateStoreLogo = async (
  id_store,
  logo,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_store) {
    throw createServiceError(
      "ID toko wajib diisi",
      422,
      "STORE_ID_REQUIRED"
    )
  }

  if (!logo) {
    throw createServiceError(
      "Logo toko wajib diisi",
      422,
      "STORE_LOGO_REQUIRED"
    )
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan",
      404,
      "STORE_NOT_FOUND"
    )
  }

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat memperbarui logo toko",
      403,
      "FORBIDDEN"
    )
  }

  if (
    Number(store.id_owner) !==
    Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke toko ini",
      403,
      "STORE_ACCESS_DENIED"
    )
  }

  const updated = await storeModel.updateLogo(
    id_store,
    logo
  )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui logo toko",
      500,
      "STORE_LOGO_UPDATE_FAILED"
    )
  }

  return await storeModel.findById(id_store)
}

/*
|--------------------------------------------------------------------------
| DELETE STORE
|--------------------------------------------------------------------------
*/
const deleteStore = async (
  id_store,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_store) {
    throw createServiceError(
      "ID toko wajib diisi",
      422,
      "STORE_ID_REQUIRED"
    )
  }

  const store = await storeModel.findById(id_store)

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan",
      404,
      "STORE_NOT_FOUND"
    )
  }

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat menghapus toko",
      403,
      "FORBIDDEN"
    )
  }

  if (
    Number(store.id_owner) !==
    Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke toko ini",
      403,
      "STORE_ACCESS_DENIED"
    )
  }

  const deleted = await storeModel.remove(id_store)

  if (!deleted) {
    throw createServiceError(
      "Gagal menghapus toko",
      500,
      "STORE_DELETE_FAILED"
    )
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
  getMyStoreUsage,
  createStore,
  updateStore,
  updateStoreLogo,
  deleteStore
}