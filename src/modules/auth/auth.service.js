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
| Menambahkan "super_admin" sebagai role yang valid.
|--------------------------------------------------------------------------
*/
const normalizeRole = (role) => {
  const value = String(role || "")
    .toLowerCase()
    .trim()

  if (value === "super_admin") return "super_admin"
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
*/
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex")
}

/*
|--------------------------------------------------------------------------
| GENERATE OTP
|--------------------------------------------------------------------------
*/
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString()
}

/*
|--------------------------------------------------------------------------
| HASH TOKEN / OTP
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
  return new Date(Date.now() + Number(minutes) * 60 * 1000)
}

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Hanya untuk role owner. Super_admin tidak didaftarkan melalui endpoint ini.
|--------------------------------------------------------------------------
*/
const registerOwner = async (data = {}) => {
  const namaLengkap = String(data.nama_lengkap || "").trim()
  const username = normalizeUsername(data.username)
  const email = normalizeEmail(data.email)
  const noHp = String(data.no_hp || "").trim()
  const namaToko = String(data.nama_toko || "").trim()
  const idBusinessCategory = Number(data.id_business_category)
  const logo = data.logo || null
  const password = String(data.password || "")
  const konfirmasiPassword = String(data.konfirmasi_password || "")

  // Validasi wajib
  if (!namaLengkap || !username || !email || !namaToko || !idBusinessCategory || !password || !konfirmasiPassword) {
    throw new Error(
      "Nama lengkap, username, email, nama toko, kategori usaha, password, dan konfirmasi password wajib diisi."
    )
  }

  if (!validateEmail(email)) {
    throw new Error("Format email tidak valid")
  }

  if (username.length < 3) {
    throw new Error("Username minimal 3 karakter")
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  if (password !== konfirmasiPassword) {
    throw new Error("Konfirmasi password tidak sama")
  }

  // Cek username
  const usernameExists = await authModel.findUserByUsername(username)
  if (usernameExists) {
    throw new Error("Username sudah digunakan")
  }

  // Cek email
  const emailExists = await authModel.findUserByEmail(email)
  if (emailExists) {
    if (!emailExists.email_verified_at) {
      throw new Error(
        "Email sudah terdaftar tetapi belum diverifikasi. Silakan kirim ulang email aktivasi."
      )
    }
    throw new Error("Email sudah digunakan.")
  }

  // Validasi kategori usaha
  const category = await authModel.findBusinessCategoryById(idBusinessCategory)
  if (!category) {
    throw new Error("Kategori usaha tidak ditemukan.")
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Register owner + store
  const owner = await authModel.registerOwner({
    nama_lengkap: namaLengkap,
    username,
    email,
    no_hp: noHp || null,
    password: hashedPassword,
    nama_toko: namaToko,
    id_business_category: idBusinessCategory,
    logo
  })

  // Generate verification token
  const verificationToken = generateVerificationToken()

  console.log("")
  console.log("========== REGISTER TOKEN ==========")
  console.log("RAW TOKEN       :", verificationToken)
  console.log("HASH TOKEN      :", hashToken(verificationToken))
  console.log("====================================")

  await authModel.createAuthToken({
    id_user: owner.id_user,
    token_hash: hashToken(verificationToken),
    tipe_token: "verifikasi_email",
    expires_at: addMinutes(24 * 60)
  })

  console.log("TOKEN DIKIRIM KE EMAIL :", verificationToken)

  // Kirim email aktivasi
  try {
    await mailService.sendVerificationEmail({
      email: owner.email,
      nama_lengkap: owner.nama_lengkap,
      token: verificationToken
    })

    await authModel.updateVerificationEmailSentAt(owner.id_user)

    return {
      ...owner,
      kategori_usaha: category.nama_kategori,
      verification_email_sent_at: new Date(),
      email_sent: true,
      pesan: "Registrasi berhasil. Silakan periksa email untuk mengaktifkan akun."
    }
  } catch (error) {
    console.error("Gagal mengirim email aktivasi:", error.message)

    return {
      ...owner,
      kategori_usaha: category.nama_kategori,
      email_sent: false,
      pesan: "Registrasi berhasil, tetapi email aktivasi gagal dikirim. Silakan kirim ulang email aktivasi."
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
    message: "Jika email terdaftar dan belum aktif, tautan aktivasi akan dikirim."
  }

  const user = await authModel.findUserByEmail(email)

  if (!user || user.email_verified_at) {
    return response
  }

  const verificationToken = generateVerificationToken()

  await authModel.createAuthToken({
    id_user: user.id_user,
    token_hash: hashToken(verificationToken),
    tipe_token: "verifikasi_email",
    expires_at: addMinutes(24 * 60)
  })

  await mailService.sendVerificationEmail({
    email: user.email,
    nama_lengkap: user.nama_lengkap,
    token: verificationToken
  })

  await authModel.updateVerificationEmailSentAt(user.id_user)

  return response
}

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
| Setelah verifikasi berhasil, jika user adalah owner maka otomatis dibuatkan
| subscription dengan paket Free (dengan tanggal_berakhir diisi 10000 hari ke depan).
|--------------------------------------------------------------------------
*/
const verifyEmail = async (token) => {
  const rawToken = String(token || "").trim()

  if (!rawToken) {
    throw new Error("Token aktivasi wajib diisi")
  }

  const hashedToken = hashToken(rawToken)

  console.log("")
  console.log("========== VERIFY EMAIL ==========")
  console.log("RAW TOKEN    :", rawToken)
  console.log("HASH TOKEN   :", hashedToken)
  console.log("==================================")

  const tokenData = await authModel.findValidAuthToken(hashedToken, "verifikasi_email")

  console.log("TOKEN DATA :", tokenData)

  if (!tokenData) {
    throw new Error("Tautan aktivasi tidak valid, sudah digunakan, atau sudah kedaluwarsa")
  }

  // 1. Verifikasi email
  await authModel.verifyEmailWithToken({
    id_user: tokenData.id_user,
    id_token: tokenData.id_token
  })

  // 2. Cek apakah user adalah owner
  const user = await authModel.findUserById(tokenData.id_user)

  if (user && user.role === 'owner') {
    // 3. Pastikan paket Free tersedia (buat jika belum ada)
    const freePlan = await authModel.ensureFreePlan()

    // 4. Cek apakah owner sudah memiliki subscription aktif
    const existingSub = await authModel.findActiveSubscriptionByOwner(user.id_user)

    // 5. Jika belum punya subscription dan paket Free ada, buat subscription Free
    if (!existingSub && freePlan) {
      // Tanggal mulai = sekarang
      const tanggalMulai = new Date()
      // Tanggal berakhir = 10000 hari ke depan (agar tidak null)
      const tanggalBerakhir = new Date(tanggalMulai)
      tanggalBerakhir.setDate(tanggalBerakhir.getDate() + 10000) // +10000 hari

      await authModel.createSubscription({
        id_owner: user.id_user,
        id_plan: freePlan.id_plan,
        jumlah_bulan: 0, // 0 artinya tidak terbatas
        tanggal_mulai: tanggalMulai,
        tanggal_berakhir: tanggalBerakhir, // SEKARANG TIDAK NULL
        harga: 0,
        status_langganan: 'aktif',
        metode_pembayaran: 'manual_transfer',
        kode_invoice: authModel.generateInvoiceCode('INV-FREE'),
        catatan: 'Subscription otomatis dari verifikasi email (Free, berakhir 10000 hari)'
      })

      console.log(`[INFO] Subscription Free berhasil dibuat untuk owner ID: ${user.id_user} dengan tanggal_berakhir = ${tanggalBerakhir}`)
    }
  }

  return {
    id_user: tokenData.id_user,
    email: tokenData.email,
    email_verified: true,
    status_akun: "aktif",
    message: "Aktivasi akun berhasil. Akun Anda sudah aktif dan dapat digunakan untuk login."
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
| - Super_admin TIDAK wajib verifikasi email.
| - Super_admin TIDAK wajib memiliki toko.
| - Owner wajib verifikasi email.
| - Admin & kasir wajib memiliki toko aktif.
|--------------------------------------------------------------------------
*/
const login = async (data = {}) => {
  const loginValue = String(
    data.usernameOrEmail || data.username || data.email || ""
  ).trim()

  const password = String(data.password || "")

  if (!loginValue || !password) {
    throw new Error("Username/email dan password wajib diisi")
  }

  const user = await authModel.findUserByUsernameOrEmail(loginValue)

  if (!user) {
    throw new Error("Username/email atau password salah")
  }

  // Validasi password
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new Error("Username/email atau password salah")
  }

  // Normalisasi role
  const role = normalizeRole(user.role)
  if (!role) {
    throw new Error("Role user tidak valid.")
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI EMAIL (kecuali super_admin)
  |--------------------------------------------------------------------------
  */
  if (role === "owner" && !user.email_verified_at) {
    throw new Error("Email belum diverifikasi. Silakan periksa email atau kirim ulang email aktivasi.")
  }

  // Super_admin TIDAK perlu verifikasi email
  if (role === "super_admin") {
    // Super_admin tidak perlu verifikasi email dan tidak perlu toko
    // Lanjutkan tanpa validasi toko
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI STATUS AKUN
  |--------------------------------------------------------------------------
  */
  if (user.status_akun !== "aktif") {
    throw new Error("Akun Anda sedang nonaktif.")
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI TOKO (kecuali super_admin)
  |--------------------------------------------------------------------------
  */
  if (role !== "super_admin") {
    if (!user.id_store && (role === "owner" || role === "admin" || role === "kasir")) {
      throw new Error("Akun belum terhubung dengan toko.")
    }

    if (user.id_store && user.status_toko !== "aktif") {
      throw new Error("Toko sedang nonaktif.")
    }
  }

  await authModel.updateLastLogin(user.id_user)

  const token = generateToken({
    id_user: user.id_user,
    id_store: user.id_store, // super_admin bisa null
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
      email_verified_at: user.email_verified_at,
      no_hp: user.no_hp,
      role,
      status_akun: user.status_akun,
      foto: user.foto,
      nama_toko: user.nama_toko,
      logo_toko: user.logo_toko,
      status_toko: user.status_toko,
      id_business_category: user.id_business_category,
      kategori_usaha: user.kategori_usaha
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
    message: "Jika email terdaftar, kode OTP reset password akan dikirim ke email."
  }

  const user = await authModel.findUserByEmail(email)

  if (!user) {
    return response
  }

  const otp = generateOtp()

  await authModel.createAuthToken({
    id_user: user.id_user,
    token_hash: hashToken(otp),
    tipe_token: "reset_password",
    expires_at: addMinutes(10)
  })

  await mailService.sendResetPasswordEmail({
    email: user.email,
    nama_lengkap: user.nama_lengkap,
    otp
  })

  return response
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD USING OTP
|--------------------------------------------------------------------------
*/
const resetPassword = async (data = {}) => {
  const email = normalizeEmail(data.email)
  const otp = String(data.otp || "").trim()
  const passwordBaru = String(data.password_baru || data.passwordBaru || "")
  const konfirmasiPassword = String(data.konfirmasi_password || data.konfirmasiPassword || "")

  if (!email || !otp || !passwordBaru || !konfirmasiPassword) {
    throw new Error("Email, OTP, password baru, dan konfirmasi password wajib diisi")
  }

  if (!validateEmail(email)) {
    throw new Error("Format email tidak valid")
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Kode OTP harus terdiri dari 6 digit")
  }

  if (passwordBaru.length < 6) {
    throw new Error("Password baru minimal 6 karakter")
  }

  if (passwordBaru !== konfirmasiPassword) {
    throw new Error("Konfirmasi password tidak sama")
  }

  const otpData = await authModel.findValidResetOtp({
    email,
    otp_hash: hashToken(otp)
  })

  if (!otpData) {
    throw new Error("Kode OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa")
  }

  const sameAsOldPassword = await bcrypt.compare(passwordBaru, otpData.password)
  if (sameAsOldPassword) {
    throw new Error("Password baru tidak boleh sama dengan password lama")
  }

  const hashedPassword = await bcrypt.hash(passwordBaru, 10)

  await authModel.resetPasswordWithToken({
    id_user: otpData.id_user,
    id_token: otpData.id_token,
    hashed_password: hashedPassword
  })

  return {
    message: "Password berhasil diubah. Silakan login menggunakan password baru."
  }
}

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
| (Tidak berubah, sudah support semua role termasuk super_admin)
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
    id_user: user.id_user,
    id_store: user.id_store,
    nama_lengkap: user.nama_lengkap,
    username: user.username,
    email: user.email,
    email_verified_at: user.email_verified_at,
    email_verified: Boolean(user.email_verified_at),
    verification_email_sent_at: user.verification_email_sent_at,
    no_hp: user.no_hp,
    role: user.role,
    status_akun: user.status_akun,
    foto: user.foto,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,

    // Store
    nama_toko: user.nama_toko,
    alamat_toko: user.alamat_toko,
    no_hp_toko: user.no_hp_toko,
    email_toko: user.email_toko,
    logo_toko: user.logo_toko,
    status_toko: user.status_toko,

    // Business category
    id_business_category: user.id_business_category,
    kategori_usaha: user.kategori_usaha,

    // Owner
    total_toko: Number(user.total_toko || 0)
  }
}

/*
|--------------------------------------------------------------------------
| GET BUSINESS CATEGORIES
|--------------------------------------------------------------------------
*/
const getBusinessCategories = async () => {
  const categories = await authModel.getBusinessCategories()
  return {
    message: "Kategori usaha berhasil diambil.",
    data: categories
  }
}

module.exports = {
  registerOwner,
  getBusinessCategories,
  resendVerificationEmail,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getProfile
}