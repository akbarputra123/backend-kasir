
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
 *     summary: Register owner pertama
 *     description: Membuat akun owner pertama untuk aplikasi SIOPOS. Akun dibuat dalam status nonaktif dan email aktivasi akan dikirim ke alamat email yang didaftarkan.
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
 *                 example: Owner SIOPOS
 *               username:
 *                 type: string
 *                 example: owner
 *               email:
 *                 type: string
 *                 format: email
 *                 example: owner@siopos.com
 *               no_hp:
 *                 type: string
 *                 nullable: true
 *                 example: "081234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "123456"
 *               konfirmasi_password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Registrasi owner berhasil dan email aktivasi telah diproses
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
 *                       example: 1
 *                     nama_lengkap:
 *                       type: string
 *                       example: Owner SIOPOS
 *                     username:
 *                       type: string
 *                       example: owner
 *                     email:
 *                       type: string
 *                       example: owner@siopos.com
 *                     role:
 *                       type: string
 *                       example: owner
 *                     status_akun:
 *                       type: string
 *                       example: nonaktif
 *                     email_sent:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Registrasi gagal atau data tidak valid
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
 *     description: Mengirim ulang tautan aktivasi untuk akun yang belum melakukan verifikasi email. Respons dibuat umum untuk menjaga keamanan data user.
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
 *                 example: owner@siopos.com
 *     responses:
 *       200:
 *         description: Permintaan pengiriman email aktivasi berhasil diproses
 *       400:
 *         description: Email tidak valid atau pengiriman gagal
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
 *     description: Memverifikasi token aktivasi dari email. Setelah berhasil, email_verified_at akan diisi dan status akun berubah menjadi aktif.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token aktivasi yang diterima melalui email
 *         example: 8e3a37ad18d54f8ab969e355ba019092a8ea3b7f935227a2fa00ec59bf41d1b0
 *     responses:
 *       200:
 *         description: Email berhasil diverifikasi dan akun telah aktif
 *       400:
 *         description: Token tidak valid, sudah digunakan, atau kedaluwarsa
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
 *     description: Login untuk owner, admin, atau kasir menggunakan username atau email dan password. User hanya dapat login setelah email diverifikasi dan akun berstatus aktif.
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
 *                 example: owner
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *           examples:
 *             loginDenganUsername:
 *               summary: Login menggunakan username
 *               value:
 *                 usernameOrEmail: owner
 *                 password: "123456"
 *             loginDenganEmail:
 *               summary: Login menggunakan email
 *               value:
 *                 usernameOrEmail: owner@siopos.com
 *                 password: "123456"
 *     responses:
 *       200:
 *         description: Login berhasil
 *       400:
 *         description: Username/email dan password wajib diisi
 *       401:
 *         description: Login gagal, email belum diverifikasi, atau akun nonaktif
 */
router.post(
  "/login",
  login
)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Kirim email reset password
 *     description: Mengirimkan tautan reset password ke alamat email yang terdaftar. Token reset berlaku selama 30 menit. Respons dibuat umum untuk menjaga keamanan data user.
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
 *                 example: owner@siopos.com
 *     responses:
 *       200:
 *         description: Permintaan reset password berhasil diproses
 *       400:
 *         description: Format email tidak valid atau pengiriman email gagal
 */
router.post(
  "/forgot-password",
  forgotPassword
)

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password menggunakan token
 *     description: Mengubah password user menggunakan token reset yang diterima melalui email. Token hanya dapat digunakan satu kali dan berlaku selama 30 menit.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password_baru
 *               - konfirmasi_password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token reset password dari tautan email
 *                 example: 9a49c414697bda884f4168a69100103b92970e8676b37ff67f28a584ea1fd911
 *               password_baru:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: passwordBaru123
 *               konfirmasi_password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: passwordBaru123
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: Token tidak valid, kedaluwarsa, atau data password tidak sesuai
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
 *         description: Token tidak valid atau tidak ditemukan
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
 *         description: Token valid
 *       401:
 *         description: Token tidak valid, kedaluwarsa, atau tidak ditemukan
 */
router.get(
  "/check-token",
  authMiddleware,
  checkToken
)

module.exports = router