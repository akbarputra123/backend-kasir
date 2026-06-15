
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
| VALIDATE EMAIL FORMAT
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return pattern.test(email)
}

/*
|--------------------------------------------------------------------------
| GENERATE VERIFICATION TOKEN
|--------------------------------------------------------------------------
| Token panjang digunakan untuk tautan aktivasi akun.
|--------------------------------------------------------------------------
*/
const generateVerificationToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex")
}

/*
|--------------------------------------------------------------------------
| GENERATE OTP
|--------------------------------------------------------------------------
| Menghasilkan kode OTP 6 digit.
|--------------------------------------------------------------------------
*/
const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString()
}

/*
|--------------------------------------------------------------------------
| HASH TOKEN / OTP
|--------------------------------------------------------------------------
| Database hanya menyimpan hasil hash token atau OTP.
|--------------------------------------------------------------------------
*/
const hashToken = (value) => {
  return crypto
    .createHash("sha256")
    .update(String(value || ""))
    .digest("hex")
}

/*
|--------------------------------------------------------------------------
| CREATE EXPIRED DATE
|--------------------------------------------------------------------------
*/
const addMinutes = (minutes) => {
  return new Date(
    Date.now() +
    Number(minutes) * 60 * 1000
  )
}

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Mendukung banyak owner.
|
| Owner dibedakan berdasarkan:
| - id_user
| - username
| - email
|
| Toko milik owner disimpan melalui stores.id_owner.
|--------------------------------------------------------------------------
*/
const registerOwner = async (data = {}) => {
  const namaLengkap = String(
    data.nama_lengkap || ""
  ).trim()

  const username = normalizeUsername(
    data.username
  )

  const email = normalizeEmail(
    data.email
  )

  const noHp = String(
    data.no_hp || ""
  ).trim()

  const password = String(
    data.password || ""
  )

  const konfirmasiPassword = String(
    data.konfirmasi_password || ""
  )

  /*
  |--------------------------------------------------------------------------
  | VALIDASI DATA WAJIB
  |--------------------------------------------------------------------------
  */
  if (
    !namaLengkap ||
    !username ||
    !email ||
    !password ||
    !konfirmasiPassword
  ) {
    throw new Error(
      "Nama lengkap, username, email, password, dan konfirmasi password wajib diisi"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI EMAIL
  |--------------------------------------------------------------------------
  */
  if (!validateEmail(email)) {
    throw new Error(
      "Format email tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI USERNAME
  |--------------------------------------------------------------------------
  */
  if (username.length < 3) {
    throw new Error(
      "Username minimal 3 karakter"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI PASSWORD
  |--------------------------------------------------------------------------
  */
  if (password.length < 6) {
    throw new Error(
      "Password minimal 6 karakter"
    )
  }

  if (
    password !== konfirmasiPassword
  ) {
    throw new Error(
      "Konfirmasi password tidak sama"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CEK USERNAME
  |--------------------------------------------------------------------------
  */
  const usernameExists =
    await authModel.findUserByUsername(
      username
    )

  if (usernameExists) {
    throw new Error(
      "Username sudah digunakan"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CEK EMAIL
  |--------------------------------------------------------------------------
  */
  const emailExists =
    await authModel.findUserByEmail(
      email
    )

  if (emailExists) {
    if (!emailExists.email_verified_at) {
      throw new Error(
        "Email sudah terdaftar tetapi belum diverifikasi. Silakan kirim ulang email aktivasi"
      )
    }

    throw new Error(
      "Email sudah digunakan"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | HASH PASSWORD
  |--------------------------------------------------------------------------
  */
  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    )

  /*
  |--------------------------------------------------------------------------
  | CREATE OWNER
  |--------------------------------------------------------------------------
  */
  const owner =
    await authModel.createOwner({
      nama_lengkap: namaLengkap,
      username,
      email,
      no_hp: noHp || null,
      password: hashedPassword
    })

  /*
  |--------------------------------------------------------------------------
  | CREATE TOKEN AKTIVASI
  |--------------------------------------------------------------------------
  */
  const verificationToken =
    generateVerificationToken()

  await authModel.createAuthToken({
    id_user: owner.id_user,
    token_hash:
      hashToken(verificationToken),
    tipe_token:
      "verifikasi_email",
    expires_at:
      addMinutes(24 * 60)
  })

  /*
  |--------------------------------------------------------------------------
  | KIRIM EMAIL AKTIVASI
  |--------------------------------------------------------------------------
  */
  try {
    await mailService.sendVerificationEmail({
      email: owner.email,
      nama_lengkap:
        owner.nama_lengkap,
      token: verificationToken
    })

    await authModel
      .updateVerificationEmailSentAt(
        owner.id_user
      )

    return {
      ...owner,
      verification_email_sent_at:
        new Date(),
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
| Mengirim ulang tautan aktivasi akun.
|--------------------------------------------------------------------------
*/
const resendVerificationEmail = async (
  data = {}
) => {
  const email = normalizeEmail(
    data.email
  )

  if (!email) {
    throw new Error(
      "Email wajib diisi"
    )
  }

  if (!validateEmail(email)) {
    throw new Error(
      "Format email tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | RESPONSE UMUM
  |--------------------------------------------------------------------------
  | Tidak membocorkan apakah email terdaftar.
  |--------------------------------------------------------------------------
  */
  const response = {
    message:
      "Jika email terdaftar dan belum aktif, tautan aktivasi akan dikirim."
  }

  const user =
    await authModel.findUserByEmail(
      email
    )

  if (
    !user ||
    user.email_verified_at
  ) {
    return response
  }

  const verificationToken =
    generateVerificationToken()

  await authModel.createAuthToken({
    id_user: user.id_user,
    token_hash:
      hashToken(verificationToken),
    tipe_token:
      "verifikasi_email",
    expires_at:
      addMinutes(24 * 60)
  })

  await mailService.sendVerificationEmail({
    email: user.email,
    nama_lengkap:
      user.nama_lengkap,
    token: verificationToken
  })

  await authModel
    .updateVerificationEmailSentAt(
      user.id_user
    )

  return response
}

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
| Memvalidasi token aktivasi lalu mengaktifkan akun.
|--------------------------------------------------------------------------
*/
const verifyEmail = async (token) => {
  const rawToken = String(
    token || ""
  ).trim()

  if (!rawToken) {
    throw new Error(
      "Token aktivasi wajib diisi"
    )
  }

  const tokenData =
    await authModel.findValidAuthToken(
      hashToken(rawToken),
      "verifikasi_email"
    )

  if (!tokenData) {
    throw new Error(
      "Tautan aktivasi tidak valid, sudah digunakan, atau sudah kedaluwarsa"
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
      "Aktivasi akun berhasil. Akun Anda sudah aktif dan dapat digunakan untuk login."
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
| Login menggunakan username atau email.
|--------------------------------------------------------------------------
*/
const login = async (data = {}) => {
  const loginValue = String(
    data.usernameOrEmail ||
    data.username ||
    data.email ||
    ""
  ).trim()

  const password = String(
    data.password || ""
  )

  if (
    !loginValue ||
    !password
  ) {
    throw new Error(
      "Username/email dan password wajib diisi"
    )
  }

  const user =
    await authModel
      .findUserByUsernameOrEmail(
        loginValue
      )

  if (!user) {
    throw new Error(
      "Username/email atau password salah"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI PASSWORD
  |--------------------------------------------------------------------------
  */
  const isPasswordValid =
    await bcrypt.compare(
      password,
      user.password
    )

  if (!isPasswordValid) {
    throw new Error(
      "Username/email atau password salah"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI EMAIL
  |--------------------------------------------------------------------------
  */
  if (!user.email_verified_at) {
    throw new Error(
      "Email belum diverifikasi. Silakan periksa email atau kirim ulang email aktivasi"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI STATUS AKUN
  |--------------------------------------------------------------------------
  */
  if (
    user.status_akun !== "aktif"
  ) {
    throw new Error(
      "Akun Anda sedang nonaktif"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI ROLE
  |--------------------------------------------------------------------------
  */
  const role =
    normalizeRole(user.role)

  if (!role) {
    throw new Error(
      "Role user tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN DAN KASIR WAJIB MEMILIKI TOKO
  |--------------------------------------------------------------------------
  */
  if (
    (
      role === "admin" ||
      role === "kasir"
    ) &&
    !user.id_store
  ) {
    throw new Error(
      "Akun admin/kasir belum terhubung dengan toko"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI STATUS TOKO
  |--------------------------------------------------------------------------
  */
  if (
    (
      role === "admin" ||
      role === "kasir"
    ) &&
    user.status_toko !== "aktif"
  ) {
    throw new Error(
      "Toko yang terhubung dengan akun sedang nonaktif"
    )
  }

  await authModel.updateLastLogin(
    user.id_user
  )

  const token = generateToken({
    id_user: user.id_user,
    id_store:
      user.id_store || null,
    nama_lengkap:
      user.nama_lengkap,
    username:
      user.username,
    email:
      user.email,
    role
  })

  return {
    token,

    user: {
      id_user:
        user.id_user,

      id_store:
        user.id_store || null,

      nama_lengkap:
        user.nama_lengkap,

      username:
        user.username,

      email:
        user.email,

      email_verified_at:
        user.email_verified_at,

      no_hp:
        user.no_hp,

      role,

      status_akun:
        user.status_akun,

      foto:
        user.foto,

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
| Membuat dan mengirim OTP 6 digit.
|
| OTP berlaku selama 10 menit.
|--------------------------------------------------------------------------
*/
const forgotPassword = async (
  data = {}
) => {
  const email = normalizeEmail(
    data.email
  )

  if (!email) {
    throw new Error(
      "Email wajib diisi"
    )
  }

  if (!validateEmail(email)) {
    throw new Error(
      "Format email tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | RESPONSE UMUM
  |--------------------------------------------------------------------------
  | Tidak memberitahukan apakah email terdaftar.
  |--------------------------------------------------------------------------
  */
  const response = {
    message:
      "Jika email terdaftar, kode OTP reset password akan dikirim ke email."
  }

  const user =
    await authModel.findUserByEmail(
      email
    )

  if (!user) {
    return response
  }

  /*
  |--------------------------------------------------------------------------
  | GENERATE OTP
  |--------------------------------------------------------------------------
  */
  const otp = generateOtp()

  /*
  |--------------------------------------------------------------------------
  | SIMPAN HASH OTP
  |--------------------------------------------------------------------------
  */
  await authModel.createAuthToken({
    id_user: user.id_user,
    token_hash: hashToken(otp),
    tipe_token: "reset_password",
    expires_at: addMinutes(10)
  })

  /*
  |--------------------------------------------------------------------------
  | KIRIM OTP
  |--------------------------------------------------------------------------
  */
  await mailService.sendResetPasswordEmail({
    email: user.email,
    nama_lengkap:
      user.nama_lengkap,
    otp
  })

  return response
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD USING OTP
|--------------------------------------------------------------------------
| Data yang dibutuhkan:
| - email
| - otp
| - password_baru
| - konfirmasi_password
|--------------------------------------------------------------------------
*/
const resetPassword = async (
  data = {}
) => {
  const email = normalizeEmail(
    data.email
  )

  const otp = String(
    data.otp || ""
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

  /*
  |--------------------------------------------------------------------------
  | VALIDASI DATA WAJIB
  |--------------------------------------------------------------------------
  */
  if (
    !email ||
    !otp ||
    !passwordBaru ||
    !konfirmasiPassword
  ) {
    throw new Error(
      "Email, OTP, password baru, dan konfirmasi password wajib diisi"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI EMAIL
  |--------------------------------------------------------------------------
  */
  if (!validateEmail(email)) {
    throw new Error(
      "Format email tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI OTP
  |--------------------------------------------------------------------------
  */
  if (!/^\d{6}$/.test(otp)) {
    throw new Error(
      "Kode OTP harus terdiri dari 6 digit"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI PASSWORD
  |--------------------------------------------------------------------------
  */
  if (
    passwordBaru.length < 6
  ) {
    throw new Error(
      "Password baru minimal 6 karakter"
    )
  }

  if (
    passwordBaru !==
    konfirmasiPassword
  ) {
    throw new Error(
      "Konfirmasi password tidak sama"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CARI OTP VALID BERDASARKAN EMAIL
  |--------------------------------------------------------------------------
  */
  const otpData =
    await authModel.findValidResetOtp({
      email,
      otp_hash: hashToken(otp)
    })

  if (!otpData) {
    throw new Error(
      "Kode OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | CEGAH PASSWORD SAMA DENGAN PASSWORD LAMA
  |--------------------------------------------------------------------------
  */
  const sameAsOldPassword =
    await bcrypt.compare(
      passwordBaru,
      otpData.password
    )

  if (sameAsOldPassword) {
    throw new Error(
      "Password baru tidak boleh sama dengan password lama"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | HASH PASSWORD BARU
  |--------------------------------------------------------------------------
  */
  const hashedPassword =
    await bcrypt.hash(
      passwordBaru,
      10
    )

  /*
  |--------------------------------------------------------------------------
  | UPDATE PASSWORD DAN GUNAKAN OTP
  |--------------------------------------------------------------------------
  */
  await authModel.resetPasswordWithToken({
    id_user: otpData.id_user,
    id_token: otpData.id_token,
    hashed_password:
      hashedPassword
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
    throw new Error(
      "ID user tidak ditemukan"
    )
  }

  const user =
    await authModel.findUserById(
      id_user
    )

  if (!user) {
    throw new Error(
      "User tidak ditemukan"
    )
  }

  delete user.password

  return {
    ...user,

    id_store:
      user.id_store || null,

    nama_toko:
      user.role === "owner"
        ? null
        : user.nama_toko || null,

    total_toko:
      Number(user.total_toko || 0),

    email_verified:
      Boolean(
        user.email_verified_at
      )
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
