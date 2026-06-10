const bcrypt = require("bcrypt")
const userModel = require("./user.model")

/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
| Owner melihat semua user di toko miliknya.
| Admin melihat user pada toko yang sama.
|--------------------------------------------------------------------------
*/
const getAllUsers = async (currentUser) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await userModel.findAllByOwner(currentUser.id_user)
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko")
    }

    return await userModel.findAllByStore(currentUser.id_store)
  }

  throw new Error("Anda tidak memiliki akses ke data user")
}

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/
const getUserById = async (id_user, currentUser) => {
  if (!id_user) {
    throw new Error("ID user wajib diisi")
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
      Number(user.id_store) !== Number(currentUser.id_store)
    ) {
      throw new Error("Anda tidak memiliki akses ke user ini")
    }
  } else {
    throw new Error("Anda tidak memiliki akses ke data user")
  }

  if (!user) {
    throw new Error("User tidak ditemukan")
  }

  return user
}

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
| Owner membuat admin/kasir dan menghubungkannya ke toko milik owner.
|--------------------------------------------------------------------------
*/
const createUser = async (data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat menambahkan user")
  }

  const {
    id_store,
    nama_lengkap,
    username,
    email,
    no_hp,
    password,
    role,
    status_akun
  } = data

  if (
    !id_store ||
    !nama_lengkap ||
    !username ||
    !email ||
    !password ||
    !role
  ) {
    throw new Error(
      "ID toko, nama lengkap, username, email, password, dan role wajib diisi"
    )
  }

  if (!["admin", "kasir"].includes(role)) {
    throw new Error("Role hanya boleh admin atau kasir")
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  if (status_akun && !["aktif", "nonaktif"].includes(status_akun)) {
    throw new Error("Status akun hanya boleh aktif atau nonaktif")
  }

  const store = await userModel.findStoreByIdAndOwner(
    id_store,
    currentUser.id_user
  )

  if (!store) {
    throw new Error("Toko tidak ditemukan atau bukan milik owner ini")
  }

  if (store.status_toko !== "aktif") {
    throw new Error("Toko sedang nonaktif")
  }

  const usernameExists = await userModel.findByUsername(username)

  if (usernameExists) {
    throw new Error("Username sudah digunakan")
  }

  const emailExists = await userModel.findByEmail(email)

  if (emailExists) {
    throw new Error("Email sudah digunakan")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await userModel.create({
    id_store,
    nama_lengkap,
    username,
    email,
    no_hp,
    password: hashedPassword,
    role,
    status_akun: status_akun || "aktif"
  })

  return {
    ...user,
    nama_toko: store.nama_toko
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
| Owner mengubah admin/kasir dan dapat memindahkan user ke toko miliknya.
|--------------------------------------------------------------------------
*/
const updateUser = async (id_user, data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat memperbarui user")
  }

  const user = await userModel.findByIdAndOwner(
    id_user,
    currentUser.id_user
  )

  if (!user) {
    throw new Error("User tidak ditemukan atau bukan berada di toko milik Anda")
  }

  if (user.role === "owner") {
    throw new Error("Akun owner tidak boleh diubah dari module users")
  }

  if (Number(id_user) === Number(currentUser.id_user)) {
    throw new Error("Anda tidak bisa mengubah akun sendiri dari module users")
  }

  const {
    id_store,
    nama_lengkap,
    username,
    email,
    no_hp,
    role,
    status_akun
  } = data

  if (
    !id_store ||
    !nama_lengkap ||
    !username ||
    !email ||
    !role ||
    !status_akun
  ) {
    throw new Error(
      "ID toko, nama lengkap, username, email, role, dan status akun wajib diisi"
    )
  }

  if (!["admin", "kasir"].includes(role)) {
    throw new Error("Role hanya boleh admin atau kasir")
  }

  if (!["aktif", "nonaktif"].includes(status_akun)) {
    throw new Error("Status akun hanya boleh aktif atau nonaktif")
  }

  const store = await userModel.findStoreByIdAndOwner(
    id_store,
    currentUser.id_user
  )

  if (!store) {
    throw new Error("Toko tidak ditemukan atau bukan milik owner ini")
  }

  if (store.status_toko !== "aktif") {
    throw new Error("Toko sedang nonaktif")
  }

  const usernameExists = await userModel.findByUsername(username)

  if (
    usernameExists &&
    Number(usernameExists.id_user) !== Number(id_user)
  ) {
    throw new Error("Username sudah digunakan")
  }

  const emailExists = await userModel.findByEmail(email)

  if (
    emailExists &&
    Number(emailExists.id_user) !== Number(id_user)
  ) {
    throw new Error("Email sudah digunakan")
  }

  const updated = await userModel.update(id_user, {
    id_store,
    nama_lengkap,
    username,
    email,
    no_hp,
    role,
    status_akun
  })

  if (!updated) {
    throw new Error("Gagal memperbarui user")
  }

  return await userModel.findById(id_user)
}

/*
|--------------------------------------------------------------------------
| UPDATE USER PASSWORD
|--------------------------------------------------------------------------
| Owner mengubah password admin/kasir yang berada di toko miliknya.
|--------------------------------------------------------------------------
*/
const updateUserPassword = async (id_user, data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat memperbarui password user")
  }

  const user = await userModel.findByIdAndOwner(
    id_user,
    currentUser.id_user
  )

  if (!user) {
    throw new Error("User tidak ditemukan atau bukan berada di toko milik Anda")
  }

  if (user.role === "owner") {
    throw new Error("Password owner tidak boleh diubah dari module users")
  }

  if (Number(id_user) === Number(currentUser.id_user)) {
    throw new Error("Anda tidak bisa mengubah password akun sendiri dari module users")
  }

  const { password, konfirmasi_password } = data

  if (!password) {
    throw new Error("Password wajib diisi")
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  if (konfirmasi_password && password !== konfirmasi_password) {
    throw new Error("Konfirmasi password tidak sama")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const updated = await userModel.updatePassword(
    id_user,
    hashedPassword
  )

  if (!updated) {
    throw new Error("Gagal memperbarui password")
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
| Owner menghapus admin/kasir yang berada di toko miliknya.
|--------------------------------------------------------------------------
*/
const deleteUser = async (id_user, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat menghapus user")
  }

  const user = await userModel.findByIdAndOwner(
    id_user,
    currentUser.id_user
  )

  if (!user) {
    throw new Error("User tidak ditemukan atau bukan berada di toko milik Anda")
  }

  if (user.role === "owner") {
    throw new Error("Akun owner tidak boleh dihapus")
  }

  if (Number(id_user) === Number(currentUser.id_user)) {
    throw new Error("Anda tidak bisa menghapus akun sendiri")
  }

  const deleted = await userModel.remove(id_user)

  if (!deleted) {
    throw new Error("Gagal menghapus user")
  }

  return {
    id_user: Number(id_user),
    pesan: "User berhasil dihapus"
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
}