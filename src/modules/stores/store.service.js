
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
| NORMALIZE ROLE
|--------------------------------------------------------------------------
*/
const normalizeRole = (role) => {
  return String(role || "")
    .trim()
    .toLowerCase()
}

/*
|--------------------------------------------------------------------------
| VALIDATE CURRENT USER
|--------------------------------------------------------------------------
*/
const validateCurrentUser = (
  currentUser
) => {
  if (
    !currentUser ||
    !currentUser.id_user
  ) {
    throw createServiceError(
      "User tidak valid",
      401,
      "INVALID_USER"
    )
  }

  const role = normalizeRole(
    currentUser.role
  )

  if (
    !["owner", "admin", "kasir"]
      .includes(role)
  ) {
    throw createServiceError(
      "Role user tidak valid",
      403,
      "INVALID_USER_ROLE"
    )
  }

  return {
    ...currentUser,
    role
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE OWNER
|--------------------------------------------------------------------------
*/
const validateOwner = (
  currentUser
) => {
  const user =
    validateCurrentUser(currentUser)

  if (user.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat melakukan tindakan ini",
      403,
      "OWNER_ACCESS_REQUIRED"
    )
  }

  return user
}

/*
|--------------------------------------------------------------------------
| VALIDATE EMAIL
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  if (
    email === null ||
    email === undefined ||
    String(email).trim() === ""
  ) {
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

  if (finalEmail.length > 150) {
    throw createServiceError(
      "Email toko maksimal 150 karakter",
      422,
      "STORE_EMAIL_TOO_LONG"
    )
  }

  return finalEmail
}

/*
|--------------------------------------------------------------------------
| VALIDATE PPN
|--------------------------------------------------------------------------
*/
const validatePpn = (
  ppn_aktif,
  ppn_persen
) => {
  const finalPpnAktif =
    ppn_aktif || "tidak"

  const finalPpnPersen =
    Number(ppn_persen || 0)

  if (
    !["ya", "tidak"].includes(
      finalPpnAktif
    )
  ) {
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

  if (
    finalPpnPersen < 0 ||
    finalPpnPersen > 100
  ) {
    throw createServiceError(
      "PPN persen harus berada di antara 0 sampai 100",
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
    ppn_aktif:
      finalPpnAktif,

    ppn_persen:
      finalPpnAktif === "ya"
        ? finalPpnPersen
        : 0
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE STORE DATA
|--------------------------------------------------------------------------
*/
const validateStoreData = (
  data = {},
  options = {}
) => {
  const {
    requireStatus = false
  } = options

  const namaToko = String(
    data.nama_toko || ""
  ).trim()

  if (!namaToko) {
    throw createServiceError(
      "Nama toko wajib diisi",
      422,
      "STORE_NAME_REQUIRED"
    )
  }

  if (namaToko.length > 150) {
    throw createServiceError(
      "Nama toko maksimal 150 karakter",
      422,
      "STORE_NAME_TOO_LONG"
    )
  }

  const alamat = data.alamat
    ? String(data.alamat).trim()
    : null

  const noHp = data.no_hp
    ? String(data.no_hp).trim()
    : null

  if (noHp && noHp.length > 20) {
    throw createServiceError(
      "Nomor HP maksimal 20 karakter",
      422,
      "STORE_PHONE_TOO_LONG"
    )
  }

  const email =
    validateEmail(data.email)

  let statusToko =
    data.status_toko || "aktif"

  if (
    requireStatus &&
    !data.status_toko
  ) {
    throw createServiceError(
      "Status toko wajib diisi",
      422,
      "STORE_STATUS_REQUIRED"
    )
  }

  if (
    !["aktif", "nonaktif"].includes(
      statusToko
    )
  ) {
    throw createServiceError(
      "Status toko hanya boleh aktif atau nonaktif",
      422,
      "INVALID_STORE_STATUS"
    )
  }

  const ppn = validatePpn(
    data.ppn_aktif,
    data.ppn_persen
  )

  return {
    nama_toko:
      namaToko,

    alamat,

    no_hp:
      noHp,

    email,

    logo:
      data.logo || null,

    status_toko:
      statusToko,

    ppn_aktif:
      ppn.ppn_aktif,

    ppn_persen:
      ppn.ppn_persen
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL STORES
|--------------------------------------------------------------------------
| Endpoint "semua toko" berarti semua toko milik owner yang sedang login,
| bukan seluruh toko milik semua owner.
|--------------------------------------------------------------------------
*/
const getAllStores = async (
  currentUser
) => {
  const owner =
    validateOwner(currentUser)

  return await storeModel.findByOwnerId(
    owner.id_user
  )
}

/*
|--------------------------------------------------------------------------
| GET MY STORES
|--------------------------------------------------------------------------
| Owner:
| - mendapatkan semua toko miliknya.
|
| Admin/kasir:
| - hanya mendapatkan toko yang tersimpan pada users.id_store.
|--------------------------------------------------------------------------
*/
const getMyStores = async (
  currentUser
) => {
  const user =
    validateCurrentUser(currentUser)

  if (user.role === "owner") {
    return await storeModel.findByOwnerId(
      user.id_user
    )
  }

  if (!user.id_store) {
    throw createServiceError(
      "User belum terhubung dengan toko",
      403,
      "USER_STORE_NOT_ASSIGNED"
    )
  }

  const store =
    await storeModel.findById(
      user.id_store
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
| GET STORE BY ID
|--------------------------------------------------------------------------
*/
const getStoreById = async (
  id_store,
  currentUser
) => {
  const user =
    validateCurrentUser(currentUser)

  const storeId =
    Number(id_store)

  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    throw createServiceError(
      "ID toko tidak valid",
      422,
      "INVALID_STORE_ID"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  | Query langsung memakai id_store dan id_owner.
  |--------------------------------------------------------------------------
  */
  if (user.role === "owner") {
    const store =
      await storeModel.findByIdAndOwner(
        storeId,
        user.id_user
      )

    if (!store) {
      throw createServiceError(
        "Toko tidak ditemukan atau bukan milik Anda",
        404,
        "STORE_NOT_FOUND"
      )
    }

    return store
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN DAN KASIR
  |--------------------------------------------------------------------------
  */
  if (
    !user.id_store ||
    Number(user.id_store) !== storeId
  ) {
    throw createServiceError(
      "Anda tidak memiliki akses ke toko ini",
      403,
      "STORE_ACCESS_DENIED"
    )
  }

  const store =
    await storeModel.findById(storeId)

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan",
      404,
      "STORE_NOT_FOUND"
    )
  }

  return store
}

/*
|--------------------------------------------------------------------------
| GET MY STORE USAGE
|--------------------------------------------------------------------------
*/
const getMyStoreUsage = async (
  currentUser
) => {
  const owner =
    validateOwner(currentUser)

  const usage =
    await storeModel
      .getStoreUsageByOwner(
        owner.id_user
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
*/
const createStore = async (
  data,
  currentUser
) => {
  const owner =
    validateOwner(currentUser)

  const finalData =
    validateStoreData(data)

  return await storeModel.create({
    id_owner:
      owner.id_user,

    ...finalData
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
  const owner =
    validateOwner(currentUser)

  const storeId =
    Number(id_store)

  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    throw createServiceError(
      "ID toko tidak valid",
      422,
      "INVALID_STORE_ID"
    )
  }

  const store =
    await storeModel.findByIdAndOwner(
      storeId,
      owner.id_user
    )

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan atau bukan milik Anda",
      404,
      "STORE_NOT_FOUND"
    )
  }

  const finalData =
    validateStoreData(
      {
        ...data,

        logo:
          data.logo ||
          store.logo
      },
      {
        requireStatus: true
      }
    )

  const storeNameExists =
    await storeModel
      .findByNameAndOwner(
        finalData.nama_toko,
        owner.id_user
      )

  if (
    storeNameExists &&
    Number(storeNameExists.id_store) !==
      storeId
  ) {
    throw createServiceError(
      "Nama toko sudah digunakan",
      409,
      "STORE_NAME_ALREADY_EXISTS"
    )
  }

  const updated =
    await storeModel.updateByOwner(
      storeId,
      owner.id_user,
      finalData
    )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui toko",
      500,
      "STORE_UPDATE_FAILED"
    )
  }

  return await storeModel
    .findByIdAndOwner(
      storeId,
      owner.id_user
    )
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
  const owner =
    validateOwner(currentUser)

  const storeId =
    Number(id_store)

  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    throw createServiceError(
      "ID toko tidak valid",
      422,
      "INVALID_STORE_ID"
    )
  }

  if (!logo) {
    throw createServiceError(
      "Logo toko wajib diisi",
      422,
      "STORE_LOGO_REQUIRED"
    )
  }

  const store =
    await storeModel.findByIdAndOwner(
      storeId,
      owner.id_user
    )

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan atau bukan milik Anda",
      404,
      "STORE_NOT_FOUND"
    )
  }

  const updated =
    await storeModel.updateLogoByOwner(
      storeId,
      owner.id_user,
      logo
    )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui logo toko",
      500,
      "STORE_LOGO_UPDATE_FAILED"
    )
  }

  return await storeModel
    .findByIdAndOwner(
      storeId,
      owner.id_user
    )
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
  const owner =
    validateOwner(currentUser)

  const storeId =
    Number(id_store)

  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    throw createServiceError(
      "ID toko tidak valid",
      422,
      "INVALID_STORE_ID"
    )
  }

  const store =
    await storeModel.findByIdAndOwner(
      storeId,
      owner.id_user
    )

  if (!store) {
    throw createServiceError(
      "Toko tidak ditemukan atau bukan milik Anda",
      404,
      "STORE_NOT_FOUND"
    )
  }

  const deleted =
    await storeModel.removeByOwner(
      storeId,
      owner.id_user
    )

  if (!deleted) {
    throw createServiceError(
      "Gagal menghapus toko",
      500,
      "STORE_DELETE_FAILED"
    )
  }

  return {
    id_store:
      storeId,

    pesan:
      "Toko berhasil dihapus"
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
