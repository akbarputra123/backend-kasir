
const express = require("express")

const {
  registerOwner,
  resendVerificationEmail,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  checkToken
} = require("./auth.controller")

const {
  authMiddleware
} = require("../../middlewares/authMiddleware")

const router = express.Router()

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/auth
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /auth/register-owner:
 *   post:
 *     summary: Registrasi akun owner
 *     description: Membuat akun owner baru untuk aplikasi SIOPOS. SIOPOS mendukung banyak owner. Akun dibuat dengan status nonaktif dan akan aktif setelah email berhasil diverifikasi.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_lengkap
 *               - username
 *               - email
 *               - password
 *               - konfirmasi_password
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *                 example: Akbar Saputra
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: akbarsaputra
 *               email:
 *                 type: string
 *                 format: email
 *                 example: barltzyml@gmail.com
 *               no_hp:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "password123"
 *               konfirmasi_password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "password123"
 *           example:
 *             nama_lengkap: Akbar Saputra
 *             username: akbarsaputra
 *             email: barltzyml@gmail.com
 *             no_hp: "081234567890"
 *             password: "password123"
 *             konfirmasi_password: "password123"
 *     responses:
 *       201:
 *         description: Registrasi berhasil dan email aktivasi telah diproses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: Register owner berhasil. Silakan periksa email untuk mengaktifkan akun
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                       example: 7
 *                     id_store:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     nama_lengkap:
 *                       type: string
 *                       example: Akbar Saputra
 *                     username:
 *                       type: string
 *                       example: akbarsaputra
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: barltzyml@gmail.com
 *                     no_hp:
 *                       type: string
 *                       nullable: true
 *                       example: "081234567890"
 *                     role:
 *                       type: string
 *                       enum:
 *                         - owner
 *                       example: owner
 *                     status_akun:
 *                       type: string
 *                       enum:
 *                         - aktif
 *                         - nonaktif
 *                       example: nonaktif
 *                     email_sent:
 *                       type: boolean
 *                       example: true
 *                     pesan:
 *                       type: string
 *                       example: Registrasi berhasil. Silakan periksa email untuk mengaktifkan akun.
 *       400:
 *         description: Registrasi gagal atau data tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: false
 *                 pesan:
 *                   type: string
 *                   example: Email sudah digunakan
 *                 error:
 *                   type: string
 *                   nullable: true
 *                   example: Email sudah digunakan
 */
router.post(
  "/register-owner",
  registerOwner
)

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Kirim ulang email aktivasi
 *     description: Mengirim ulang tautan aktivasi akun untuk user yang belum melakukan verifikasi email. Tautan aktivasi berlaku selama 24 jam.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: barltzyml@gmail.com
 *           example:
 *             email: barltzyml@gmail.com
 *     responses:
 *       200:
 *         description: Permintaan pengiriman ulang email aktivasi berhasil diproses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: Jika email terdaftar dan belum aktif, tautan aktivasi akan dikirim.
 *                 data:
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Format email tidak valid atau pengiriman email gagal
 */
router.post(
  "/resend-verification",
  resendVerificationEmail
)

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verifikasi dan aktifkan akun
 *     description: Memverifikasi token aktivasi dari email. Apabila berhasil, email_verified_at akan diisi dan status akun berubah menjadi aktif. Endpoint ini menampilkan halaman HTML berhasil atau gagal.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Token aktivasi yang diperoleh melalui email
 *         schema:
 *           type: string
 *         example: 8e3a37ad18d54f8ab969e355ba019092a8ea3b7f935227a2fa00ec59bf41d1b0
 *     responses:
 *       200:
 *         description: Aktivasi akun berhasil
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: Halaman Aktivasi Berhasil
 *       400:
 *         description: Token tidak valid, sudah digunakan, atau kedaluwarsa
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: Halaman Aktivasi Gagal
 */
router.get(
  "/verify-email",
  verifyEmail
)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Login owner, admin, atau kasir menggunakan username atau email dan password. User hanya dapat login setelah email diverifikasi dan akun berstatus aktif.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username atau email user
 *                 example: akbarsaputra
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *           examples:
 *             loginDenganUsername:
 *               summary: Login menggunakan username
 *               value:
 *                 usernameOrEmail: akbarsaputra
 *                 password: "password123"
 *             loginDenganEmail:
 *               summary: Login menggunakan email
 *               value:
 *                 usernameOrEmail: barltzyml@gmail.com
 *                 password: "password123"
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: Login berhasil
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *                     user:
 *                       type: object
 *       401:
 *         description: Username/email atau password salah, email belum diverifikasi, akun nonaktif, atau toko nonaktif
 */
router.post(
  "/login",
  login
)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Kirim OTP reset password
 *     description: Mengirim kode OTP 6 digit ke alamat email yang terdaftar. OTP berlaku selama 10 menit dan hanya dapat digunakan satu kali.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: barltzyml@gmail.com
 *           example:
 *             email: barltzyml@gmail.com
 *     responses:
 *       200:
 *         description: Permintaan OTP reset password berhasil diproses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: Jika email terdaftar, kode OTP reset password akan dikirim ke email.
 *                 data:
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Format email tidak valid atau pengiriman OTP gagal
 */
router.post(
  "/forgot-password",
  forgotPassword
)

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password menggunakan OTP
 *     description: Mengubah password user menggunakan email dan OTP 6 digit yang diterima melalui email. OTP hanya dapat digunakan satu kali dan berlaku selama 10 menit.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - password_baru
 *               - konfirmasi_password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email akun yang meminta reset password
 *                 example: barltzyml@gmail.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: "^\\d{6}$"
 *                 description: Kode OTP 6 digit dari email
 *                 example: "482915"
 *               password_baru:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Password baru minimal 6 karakter
 *                 example: "passwordBaru123"
 *               konfirmasi_password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Konfirmasi password baru
 *                 example: "passwordBaru123"
 *           example:
 *             email: barltzyml@gmail.com
 *             otp: "482915"
 *             password_baru: "passwordBaru123"
 *             konfirmasi_password: "passwordBaru123"
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: Password berhasil diubah. Silakan login menggunakan password baru.
 *                 data:
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Email tidak valid, OTP salah, OTP kedaluwarsa, atau password tidak sesuai
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: false
 *                 pesan:
 *                   type: string
 *                   example: Kode OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa
 *                 error:
 *                   type: string
 *                   nullable: true
 */
router.post(
  "/reset-password",
  resetPassword
)

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Ambil profil user login
 *     description: Mengambil data profil user berdasarkan token JWT, termasuk role, status akun, status verifikasi email, dan nama toko jika user terhubung dengan toko.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil berhasil diambil
 *       401:
 *         description: Token JWT tidak valid atau tidak ditemukan
 *       400:
 *         description: Gagal mengambil profil
 */
router.get(
  "/profile",
  authMiddleware,
  getProfile
)

/**
 * @swagger
 * /auth/check-token:
 *   get:
 *     summary: Cek token JWT
 *     description: Mengecek apakah token JWT masih valid dan mengembalikan data dasar user dari token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token JWT valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: Token valid
 *                 data:
 *                   type: object
 *       401:
 *         description: Token JWT tidak valid, kedaluwarsa, atau tidak ditemukan
 */
router.get(
  "/check-token",
  authMiddleware,
  checkToken
)

module.exports = router
