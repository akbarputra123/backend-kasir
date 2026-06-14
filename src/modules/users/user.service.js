const bcrypt = require("bcrypt")
const userModel = require("./user.model")

/*
|--------------------------------------------------------------------------
| CREATE SERVICE ERROR
|--------------------------------------------------------------------------
*/
const createServiceError = (
  message,
  statusCode = 400,
  code = "USER_SERVICE_ERROR",
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
| VALIDATE EMAIL
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  const finalEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase()

  if (!finalEmail) {
    throw createServiceError(
      "Email wajib diisi",
      422,
      "EMAIL_REQUIRED"
    )
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(finalEmail)) {
    throw createServiceError(
      "Format email tidak valid",
      422,
      "INVALID_EMAIL"
    )
  }

  if (finalEmail.length > 150) {
    throw createServiceError(
      "Email maksimal 150 karakter",
      422,
      "EMAIL_TOO_LONG"
    )
  }

  return finalEmail
}

/*
|--------------------------------------------------------------------------
| VALIDATE PHONE
|--------------------------------------------------------------------------
*/
const validatePhone = (no_hp) => {
  if (!no_hp) {
    return null
  }

  const finalPhone = String(no_hp).trim()

  if (finalPhone.length > 20) {
    throw createServiceError(
      "Nomor HP maksimal 20 karakter",
      422,
      "PHONE_TOO_LONG"
    )
  }

  if (!/^[0-9+\-\s]+$/.test(finalPhone)) {
    throw createServiceError(
      "Format nomor HP tidak valid",
      422,
      "INVALID_PHONE"
    )
  }

  return finalPhone
}

/*
|--------------------------------------------------------------------------
| VALIDATE USER DATA
|--------------------------------------------------------------------------
*/
const validateUserData = (data) => {
  const finalName = String(
    data.nama_lengkap || ""
  ).trim()

  const finalUsername = String(
    data.username || ""
  )
    .trim()
    .toLowerCase()

  if (!finalName) {
    throw createServiceError(
      "Nama lengkap wajib diisi",
      422,
      "FULL_NAME_REQUIRED"
    )
  }

  if (finalName.length > 150) {
    throw createServiceError(
      "Nama lengkap maksimal 150 karakter",
      422,
      "FULL_NAME_TOO_LONG"
    )
  }

  if (!finalUsername) {
    throw createServiceError(
      "Username wajib diisi",
      422,
      "USERNAME_REQUIRED"
    )
  }

  if (finalUsername.length > 100) {
    throw createServiceError(
      "Username maksimal 100 karakter",
      422,
      "USERNAME_TOO_LONG"
    )
  }

  if (
    !/^[a-zA-Z0-9._-]+$/.test(
      finalUsername
    )
  ) {
    throw createServiceError(
      "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung",
      422,
      "INVALID_USERNAME"
    )
  }

  return {
    nama_lengkap: finalName,
    username: finalUsername,
    email: validateEmail(data.email),
    no_hp: validatePhone(data.no_hp)
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
*/
const getAllUsers = async (currentUser) => {
  validateCurrentUser(currentUser)

  if (currentUser.role === "owner") {
    return await userModel.findAllByOwner(
      currentUser.id_user
    )
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw createServiceError(
        "Admin belum terhubung dengan toko",
        403,
        "ADMIN_STORE_NOT_ASSIGNED"
      )
    }

    return await userModel.findAllByStore(
      currentUser.id_store
    )
  }

  throw createServiceError(
    "Anda tidak memiliki akses ke data user",
    403,
    "FORBIDDEN"
  )
}

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/
const getUserById = async (
  id_user,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (!id_user) {
    throw createServiceError(
      "ID user wajib diisi",
      422,
      "USER_ID_REQUIRED"
    )
  }

  let user = null

  if (currentUser.role === "owner") {
    user = await userModel.findByIdAndOwner(
      id_user,
      currentUser.id_user
    )
  } else if (currentUser.role === "admin") {
    user = await userModel.findById(id_user)

    if (
      user &&
      Number(user.id_store) !==
        Number(currentUser.id_store)
    ) {
      throw createServiceError(
        "Anda tidak memiliki akses ke user ini",
        403,
        "USER_ACCESS_DENIED"
      )
    }
  } else {
    throw createServiceError(
      "Anda tidak memiliki akses ke data user",
      403,
      "FORBIDDEN"
    )
  }

  if (!user) {
    throw createServiceError(
      "User tidak ditemukan",
      404,
      "USER_NOT_FOUND"
    )
  }

  return user
}

/*
|--------------------------------------------------------------------------
| GET MY USER USAGE
|--------------------------------------------------------------------------
| Mengambil jumlah penggunaan batas admin/kasir.
|--------------------------------------------------------------------------
*/
const getMyUserUsage = async (currentUser) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat melihat penggunaan paket",
      403,
      "FORBIDDEN"
    )
  }

  const usage =
    await userModel.getUserUsageByOwner(
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
| CREATE USER
|--------------------------------------------------------------------------
*/
const createUser = async (
  data,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat menambahkan user",
      403,
      "FORBIDDEN"
    )
  }

  const {
    id_store,
    password,
    role,
    status_akun
  } = data

  if (!id_store) {
    throw createServiceError(
      "ID toko wajib diisi",
      422,
      "STORE_ID_REQUIRED"
    )
  }

  if (!password) {
    throw createServiceError(
      "Password wajib diisi",
      422,
      "PASSWORD_REQUIRED"
    )
  }

  if (String(password).length < 6) {
    throw createServiceError(
      "Password minimal 6 karakter",
      422,
      "PASSWORD_TOO_SHORT"
    )
  }

  if (!["admin", "kasir"].includes(role)) {
    throw createServiceError(
      "Role hanya boleh admin atau kasir",
      422,
      "INVALID_ROLE"
    )
  }

  const finalStatus =
    status_akun || "aktif"

  if (
    !["aktif", "nonaktif"].includes(
      finalStatus
    )
  ) {
    throw createServiceError(
      "Status akun hanya boleh aktif atau nonaktif",
      422,
      "INVALID_ACCOUNT_STATUS"
    )
  }

  const validatedData =
    validateUserData(data)

  /*
  |--------------------------------------------------------------------------
  | HASH PASSWORD
  |--------------------------------------------------------------------------
  */
  const hashedPassword = await bcrypt.hash(
    String(password),
    10
  )

  /*
  |--------------------------------------------------------------------------
  | CREATE WITH PACKAGE LIMIT
  |--------------------------------------------------------------------------
  | Pemeriksaan toko, username, email, langganan dan batas user dilakukan
  | kembali oleh model dalam satu transaction.
  |--------------------------------------------------------------------------
  */
  return await userModel.create({
    id_owner: currentUser.id_user,
    id_store: Number(id_store),
    nama_lengkap:
      validatedData.nama_lengkap,
    username: validatedData.username,
    email: validatedData.email,
    no_hp: validatedData.no_hp,
    password: hashedPassword,
    role,
    status_akun: finalStatus
  })
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
const updateUser = async (
  id_user,
  data,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat memperbarui user",
      403,
      "FORBIDDEN"
    )
  }

  if (!id_user) {
    throw createServiceError(
      "ID user wajib diisi",
      422,
      "USER_ID_REQUIRED"
    )
  }

  const user =
    await userModel.findByIdAndOwner(
      id_user,
      currentUser.id_user
    )

  if (!user) {
    throw createServiceError(
      "User tidak ditemukan atau bukan berada di toko milik Anda",
      404,
      "USER_NOT_FOUND"
    )
  }

  if (user.role === "owner") {
    throw createServiceError(
      "Akun owner tidak boleh diubah dari module users",
      403,
      "OWNER_UPDATE_NOT_ALLOWED"
    )
  }

  if (
    Number(id_user) ===
    Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak bisa mengubah akun sendiri dari module users",
      403,
      "SELF_UPDATE_NOT_ALLOWED"
    )
  }

  const {
    id_store,
    role,
    status_akun
  } = data

  if (!id_store) {
    throw createServiceError(
      "ID toko wajib diisi",
      422,
      "STORE_ID_REQUIRED"
    )
  }

  if (!["admin", "kasir"].includes(role)) {
    throw createServiceError(
      "Role hanya boleh admin atau kasir",
      422,
      "INVALID_ROLE"
    )
  }

  if (
    !["aktif", "nonaktif"].includes(
      status_akun
    )
  ) {
    throw createServiceError(
      "Status akun hanya boleh aktif atau nonaktif",
      422,
      "INVALID_ACCOUNT_STATUS"
    )
  }

  const validatedData =
    validateUserData(data)

  const store =
    await userModel.findStoreByIdAndOwner(
      id_store,
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

  const usernameExists =
    await userModel.findByUsername(
      validatedData.username
    )

  if (
    usernameExists &&
    Number(usernameExists.id_user) !==
      Number(id_user)
  ) {
    throw createServiceError(
      "Username sudah digunakan",
      409,
      "USERNAME_ALREADY_EXISTS"
    )
  }

  const emailExists =
    await userModel.findByEmail(
      validatedData.email
    )

  if (
    emailExists &&
    Number(emailExists.id_user) !==
      Number(id_user)
  ) {
    throw createServiceError(
      "Email sudah digunakan",
      409,
      "EMAIL_ALREADY_EXISTS"
    )
  }

  const updated = await userModel.update(
    id_user,
    {
      id_store: Number(id_store),
      nama_lengkap:
        validatedData.nama_lengkap,
      username: validatedData.username,
      email: validatedData.email,
      no_hp: validatedData.no_hp,
      role,
      status_akun
    }
  )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui user",
      500,
      "USER_UPDATE_FAILED"
    )
  }

  return await userModel.findById(id_user)
}

/*
|--------------------------------------------------------------------------
| UPDATE USER PASSWORD
|--------------------------------------------------------------------------
*/
const updateUserPassword = async (
  id_user,
  data,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat memperbarui password user",
      403,
      "FORBIDDEN"
    )
  }

  if (!id_user) {
    throw createServiceError(
      "ID user wajib diisi",
      422,
      "USER_ID_REQUIRED"
    )
  }

  const user =
    await userModel.findByIdAndOwner(
      id_user,
      currentUser.id_user
    )

  if (!user) {
    throw createServiceError(
      "User tidak ditemukan atau bukan berada di toko milik Anda",
      404,
      "USER_NOT_FOUND"
    )
  }

  if (user.role === "owner") {
    throw createServiceError(
      "Password owner tidak boleh diubah dari module users",
      403,
      "OWNER_PASSWORD_UPDATE_NOT_ALLOWED"
    )
  }

  if (
    Number(id_user) ===
    Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak bisa mengubah password akun sendiri dari module users",
      403,
      "SELF_PASSWORD_UPDATE_NOT_ALLOWED"
    )
  }

  const {
    password,
    konfirmasi_password
  } = data

  if (!password) {
    throw createServiceError(
      "Password wajib diisi",
      422,
      "PASSWORD_REQUIRED"
    )
  }

  if (String(password).length < 6) {
    throw createServiceError(
      "Password minimal 6 karakter",
      422,
      "PASSWORD_TOO_SHORT"
    )
  }

  if (
    konfirmasi_password &&
    password !== konfirmasi_password
  ) {
    throw createServiceError(
      "Konfirmasi password tidak sama",
      422,
      "PASSWORD_CONFIRMATION_MISMATCH"
    )
  }

  const hashedPassword = await bcrypt.hash(
    String(password),
    10
  )

  const updated =
    await userModel.updatePassword(
      id_user,
      hashedPassword
    )

  if (!updated) {
    throw createServiceError(
      "Gagal memperbarui password",
      500,
      "PASSWORD_UPDATE_FAILED"
    )
  }

  return {
    id_user: Number(id_user),
    pesan: "Password user berhasil diperbarui"
  }
}

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/
const deleteUser = async (
  id_user,
  currentUser
) => {
  validateCurrentUser(currentUser)

  if (currentUser.role !== "owner") {
    throw createServiceError(
      "Hanya owner yang dapat menghapus user",
      403,
      "FORBIDDEN"
    )
  }

  if (!id_user) {
    throw createServiceError(
      "ID user wajib diisi",
      422,
      "USER_ID_REQUIRED"
    )
  }

  const user =
    await userModel.findByIdAndOwner(
      id_user,
      currentUser.id_user
    )

  if (!user) {
    throw createServiceError(
      "User tidak ditemukan atau bukan berada di toko milik Anda",
      404,
      "USER_NOT_FOUND"
    )
  }

  if (user.role === "owner") {
    throw createServiceError(
      "Akun owner tidak boleh dihapus",
      403,
      "OWNER_DELETE_NOT_ALLOWED"
    )
  }

  if (
    Number(id_user) ===
    Number(currentUser.id_user)
  ) {
    throw createServiceError(
      "Anda tidak bisa menghapus akun sendiri",
      403,
      "SELF_DELETE_NOT_ALLOWED"
    )
  }

  const deleted = await userModel.remove(
    id_user
  )

  if (!deleted) {
    throw createServiceError(
      "Gagal menghapus user",
      500,
      "USER_DELETE_FAILED"
    )
  }

  return {
    id_user: Number(id_user),
    pesan: "User berhasil dihapus"
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  getMyUserUsage,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
}