
const bcrypt = require("bcrypt")
const crypto = require("crypto")

const authModel = require("./auth.model")
const mailService = require("../../mail/mail.service")

const {
  generateToken
} = require("../../config/jwt")

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
| NORMALIZE EMAIL
|--------------------------------------------------------------------------
*/
const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase()
}

/*
|--------------------------------------------------------------------------
| NORMALIZE USERNAME
|--------------------------------------------------------------------------
*/
const normalizeUsername = (username) => {
  return String(username || "").trim()
}

/*
|--------------------------------------------------------------------------
| GENERATE RAW TOKEN
|--------------------------------------------------------------------------
*/
const generateRawToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex")
}

/*
|--------------------------------------------------------------------------
| HASH TOKEN
|--------------------------------------------------------------------------
*/
const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(String(token || ""))
    .digest("hex")
}

/*
|--------------------------------------------------------------------------
| CREATE EXPIRED DATE
|--------------------------------------------------------------------------
*/
const addMinutes = (minutes) => {
  return new Date(
    Date.now() + Number(minutes) * 60 * 1000
  )
}

/*
|--------------------------------------------------------------------------
| VALIDATE EMAIL FORMAT
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return pattern.test(email)
}

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Mendukung banyak owner.
|
| Setiap owner dibedakan oleh:
| - id_user
| - username
| - email
|
| Toko owner disimpan melalui stores.id_owner, bukan users.id_store.
|--------------------------------------------------------------------------
*/
const registerOwner = async (data = {}) => {
  const {
    nama_lengkap,
    username,
    email,
    no_hp,
    password,
    konfirmasi_password
  } = data

  const normalizedName = String(
    nama_lengkap || ""
  ).trim()

  const normalizedUsername =
    normalizeUsername(username)

  const normalizedEmail =
    normalizeEmail(email)

  const normalizedPhone = String(
    no_hp || ""
  ).trim()

  if (
    !normalizedName ||
    !normalizedUsername ||
    !normalizedEmail ||
    !password ||
    !konfirmasi_password
  ) {
    throw new Error(
      "Nama lengkap, username, email, password, dan konfirmasi password wajib diisi"
    )
  }

  if (!validateEmail(normalizedEmail)) {
    throw new Error("Format email tidak valid")
  }

  if (normalizedUsername.length < 3) {
    throw new Error("Username minimal 3 karakter")
  }

  if (String(password).length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  if (password !== konfirmasi_password) {
    throw new Error("Konfirmasi password tidak sama")
  }

  /*
  |--------------------------------------------------------------------------
  | TIDAK ADA COUNT OWNER
  |--------------------------------------------------------------------------
  | SIOPOS mendukung banyak owner.
  |--------------------------------------------------------------------------
  */

  const usernameExists =
    await authModel.findUserByUsername(
      normalizedUsername
    )

  if (usernameExists) {
    throw new Error("Username sudah digunakan")
  }

  const emailExists =
    await authModel.findUserByEmail(
      normalizedEmail
    )

  if (emailExists) {
    if (!emailExists.email_verified_at) {
      throw new Error(
        "Email sudah terdaftar tetapi belum diverifikasi. Silakan kirim ulang email aktivasi"
      )
    }

    throw new Error("Email sudah digunakan")
  }

  const hashedPassword = await bcrypt.hash(
    String(password),
    10
  )

  const owner = await authModel.createOwner({
    nama_lengkap: normalizedName,
    username: normalizedUsername,
    email: normalizedEmail,
    no_hp: normalizedPhone || null,
    password: hashedPassword
  })

  const rawToken = generateRawToken()

  await authModel.createAuthToken({
    id_user: owner.id_user,
    token_hash: hashToken(rawToken),
    tipe_token: "verifikasi_email",
    expires_at: addMinutes(24 * 60)
  })

  try {
    await mailService.sendVerificationEmail({
      email: owner.email,
      nama_lengkap: owner.nama_lengkap,
      token: rawToken
    })

    await authModel.updateVerificationEmailSentAt(
      owner.id_user
    )

    return {
      ...owner,
      email_sent: true,
      pesan:
        "Registrasi berhasil. Silakan periksa email untuk mengaktifkan akun."
    }
  } catch (error) {
    console.error(
      "Gagal mengirim email aktivasi:",
      error.message
    )

    return {
      ...owner,
      email_sent: false,
      pesan:
        "Registrasi berhasil, tetapi email aktivasi gagal dikirim. Silakan kirim ulang email aktivasi."
    }
  }
}

/*
|--------------------------------------------------------------------------
| RESEND VERIFICATION EMAIL
|--------------------------------------------------------------------------
*/
const resendVerificationEmail = async (data = {}) => {
  const email = normalizeEmail(data.email)

  if (!email) {
    throw new Error("Email wajib diisi")
  }

  if (!validateEmail(email)) {
    throw new Error("Format email tidak valid")
  }

  const response = {
    message:
      "Jika email terdaftar dan belum aktif, tautan aktivasi akan dikirim."
  }

  const user = await authModel.findUserByEmail(email)

  if (!user || user.email_verified_at) {
    return response
  }

  const rawToken = generateRawToken()

  await authModel.createAuthToken({
    id_user: user.id_user,
    token_hash: hashToken(rawToken),
    tipe_token: "verifikasi_email",
    expires_at: addMinutes(24 * 60)
  })

  await mailService.sendVerificationEmail({
    email: user.email,
    nama_lengkap: user.nama_lengkap,
    token: rawToken
  })

  await authModel.updateVerificationEmailSentAt(
    user.id_user
  )

  return response
}

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
*/
const verifyEmail = async (token) => {
  const rawToken = String(token || "").trim()

  if (!rawToken) {
    throw new Error("Token aktivasi wajib diisi")
  }

  const tokenData =
    await authModel.findValidAuthToken(
      hashToken(rawToken),
      "verifikasi_email"
    )

  if (!tokenData) {
    throw new Error(
      "Token aktivasi tidak valid, sudah digunakan, atau sudah kedaluwarsa"
    )
  }

  await authModel.verifyEmailWithToken({
    id_user: tokenData.id_user,
    id_token: tokenData.id_token
  })

  return {
    id_user: tokenData.id_user,
    email: tokenData.email,
    email_verified: true,
    status_akun: "aktif",
    message:
      "Email berhasil diverifikasi. Akun Anda sudah aktif dan dapat digunakan untuk login."
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
const login = async (data = {}) => {
  const {
    usernameOrEmail,
    username,
    email,
    password
  } = data

  const loginValue = String(
    usernameOrEmail ||
    username ||
    email ||
    ""
  ).trim()

  if (!loginValue || !password) {
    throw new Error(
      "Username/email dan password wajib diisi"
    )
  }

  const user =
    await authModel.findUserByUsernameOrEmail(
      loginValue
    )

  if (!user) {
    throw new Error(
      "Username/email atau password salah"
    )
  }

  const isPasswordValid = await bcrypt.compare(
    String(password),
    user.password
  )

  if (!isPasswordValid) {
    throw new Error(
      "Username/email atau password salah"
    )
  }

  if (!user.email_verified_at) {
    throw new Error(
      "Email belum diverifikasi. Silakan periksa email atau kirim ulang email aktivasi"
    )
  }

  if (user.status_akun !== "aktif") {
    throw new Error("Akun Anda sedang nonaktif")
  }

  const role = normalizeRole(user.role)

  if (!role) {
    throw new Error("Role user tidak valid")
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN DAN KASIR WAJIB TERHUBUNG KE TOKO
  |--------------------------------------------------------------------------
  | Owner tidak wajib memiliki users.id_store.
  |--------------------------------------------------------------------------
  */
  if (
    (role === "admin" || role === "kasir") &&
    !user.id_store
  ) {
    throw new Error(
      "Akun admin/kasir belum terhubung dengan toko"
    )
  }

  if (
    (role === "admin" || role === "kasir") &&
    user.status_toko !== "aktif"
  ) {
    throw new Error(
      "Toko yang terhubung dengan akun sedang nonaktif"
    )
  }

  await authModel.updateLastLogin(user.id_user)

  const token = generateToken({
    id_user: user.id_user,
    id_store: user.id_store || null,
    nama_lengkap: user.nama_lengkap,
    username: user.username,
    email: user.email,
    role
  })

  return {
    token,

    user: {
      id_user: user.id_user,
      id_store: user.id_store || null,

      nama_lengkap: user.nama_lengkap,
      username: user.username,
      email: user.email,
      email_verified_at:
        user.email_verified_at,

      no_hp: user.no_hp,
      role,
      status_akun: user.status_akun,
      foto: user.foto,

      nama_toko:
        role === "owner"
          ? null
          : user.nama_toko || null
    }
  }
}

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/
const forgotPassword = async (data = {}) => {
  const email = normalizeEmail(data.email)

  if (!email) {
    throw new Error("Email wajib diisi")
  }

  if (!validateEmail(email)) {
    throw new Error("Format email tidak valid")
  }

  const response = {
    message:
      "Jika email terdaftar, tautan reset password akan dikirim."
  }

  const user = await authModel.findUserByEmail(email)

  if (!user) {
    return response
  }

  const rawToken = generateRawToken()

  await authModel.createAuthToken({
    id_user: user.id_user,
    token_hash: hashToken(rawToken),
    tipe_token: "reset_password",
    expires_at: addMinutes(30)
  })

  await mailService.sendResetPasswordEmail({
    email: user.email,
    nama_lengkap: user.nama_lengkap,
    token: rawToken
  })

  return response
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/
const resetPassword = async (data = {}) => {
  const token = String(
    data.token || ""
  ).trim()

  const passwordBaru = String(
    data.password_baru ||
    data.passwordBaru ||
    ""
  )

  const konfirmasiPassword = String(
    data.konfirmasi_password ||
    data.konfirmasiPassword ||
    ""
  )

  if (
    !token ||
    !passwordBaru ||
    !konfirmasiPassword
  ) {
    throw new Error(
      "Token, password baru, dan konfirmasi password wajib diisi"
    )
  }

  if (passwordBaru.length < 6) {
    throw new Error(
      "Password baru minimal 6 karakter"
    )
  }

  if (passwordBaru !== konfirmasiPassword) {
    throw new Error(
      "Konfirmasi password tidak sama"
    )
  }

  const tokenData =
    await authModel.findValidAuthToken(
      hashToken(token),
      "reset_password"
    )

  if (!tokenData) {
    throw new Error(
      "Token reset password tidak valid, sudah digunakan, atau sudah kedaluwarsa"
    )
  }

  const user = await authModel.findUserById(
    tokenData.id_user
  )

  if (!user) {
    throw new Error("User tidak ditemukan")
  }

  const sameAsOldPassword =
    await bcrypt.compare(
      passwordBaru,
      user.password
    )

  if (sameAsOldPassword) {
    throw new Error(
      "Password baru tidak boleh sama dengan password lama"
    )
  }

  const hashedPassword = await bcrypt.hash(
    passwordBaru,
    10
  )

  await authModel.resetPasswordWithToken({
    id_user: tokenData.id_user,
    id_token: tokenData.id_token,
    hashed_password: hashedPassword
  })

  return {
    message:
      "Password berhasil diubah. Silakan login menggunakan password baru."
  }
}

/*
|--------------------------------------------------------------------------
| GET PROFILE
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

  return {
    ...user,
    id_store: user.id_store || null,
    nama_toko:
      user.role === "owner"
        ? null
        : user.nama_toko || null,
    total_toko: Number(user.total_toko || 0),
    email_verified:
      Boolean(user.email_verified_at)
  }
}

module.exports = {
  registerOwner,
  resendVerificationEmail,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getProfile
}
