const bcrypt = require("bcrypt")
const authModel = require("./auth.model")
const { generateToken } = require("../../config/jwt")

/*
|--------------------------------------------------------------------------
| NORMALIZE ROLE
|--------------------------------------------------------------------------
*/
const normalizeRole = (role) => {
  const value = String(role || "")
    .toLowerCase()
    .trim()

  if (value === "owner") return "owner"
  if (value === "admin") return "admin"
  if (value === "kasir") return "kasir"

  return ""
}

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Membuat akun owner pertama untuk aplikasi SIOPOS.
|--------------------------------------------------------------------------
*/
const registerOwner = async (data) => {
  const {
    nama_lengkap,
    username,
    email,
    no_hp,
    password,
    konfirmasi_password
  } = data

  if (!nama_lengkap || !username || !email || !password) {
    throw new Error("Nama lengkap, username, email, dan password wajib diisi")
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  if (konfirmasi_password && password !== konfirmasi_password) {
    throw new Error("Konfirmasi password tidak sama")
  }

  const totalOwner = await authModel.countOwner()

  if (totalOwner > 0) {
    throw new Error("Akun owner sudah ada. Silakan login")
  }

  const usernameExists = await authModel.findUserByUsername(username)

  if (usernameExists) {
    throw new Error("Username sudah digunakan")
  }

  const emailExists = await authModel.findUserByEmail(email)

  if (emailExists) {
    throw new Error("Email sudah digunakan")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const owner = await authModel.createOwner({
    nama_lengkap,
    username,
    email,
    no_hp,
    password: hashedPassword
  })

  return owner
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
| Login user menggunakan username/email dan password.
|--------------------------------------------------------------------------
*/
const login = async (data) => {
  const { usernameOrEmail, username, email, password } = data

  const loginValue = usernameOrEmail || username || email

  if (!loginValue || !password) {
    throw new Error("Username/email dan password wajib diisi")
  }

  const user = await authModel.findUserByUsernameOrEmail(loginValue)

  if (!user) {
    throw new Error("Username/email atau password salah")
  }

  if (user.status_akun !== "aktif") {
    throw new Error("Akun Anda sedang nonaktif")
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new Error("Username/email atau password salah")
  }

  const role = normalizeRole(user.role)

  if (!role) {
    throw new Error("Role user tidak valid")
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN / KASIR WAJIB PUNYA TOKO
  |--------------------------------------------------------------------------
  | Karena transaksi admin/kasir bergantung ke id_store.
  |--------------------------------------------------------------------------
  */
  if ((role === "admin" || role === "kasir") && !user.id_store) {
    throw new Error("Akun admin/kasir belum terhubung dengan toko")
  }

  await authModel.updateLastLogin(user.id_user)

  const token = generateToken({
    id_user: user.id_user,
    id_store: user.id_store,
    nama_lengkap: user.nama_lengkap,
    username: user.username,
    email: user.email,
    role
  })

  return {
    token,
    user: {
      id_user: user.id_user,
      id_store: user.id_store,
      nama_lengkap: user.nama_lengkap,
      username: user.username,
      email: user.email,
      no_hp: user.no_hp,
      role,
      status_akun: user.status_akun,
      foto: user.foto
    }
  }
}

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
| Mengambil profile user berdasarkan id_user dari token JWT.
|--------------------------------------------------------------------------
*/
const getProfile = async (id_user) => {
  if (!id_user) {
    throw new Error("ID user tidak ditemukan")
  }

  const user = await authModel.findUserById(id_user)

  if (!user) {
    throw new Error("User tidak ditemukan")
  }

  delete user.password

  return user
}

module.exports = {
  registerOwner,
  login,
  getProfile
}