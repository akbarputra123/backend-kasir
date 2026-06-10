const express = require("express")

const {
  registerOwner,
  login,
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
 *     description: Membuat akun owner pertama untuk aplikasi SIOPOS. Endpoint ini hanya bisa digunakan jika belum ada owner di database.
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
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *                 example: Owner SIOPOS
 *               username:
 *                 type: string
 *                 example: owner
 *               email:
 *                 type: string
 *                 example: owner@siopos.com
 *               no_hp:
 *                 type: string
 *                 example: "081234567890"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               konfirmasi_password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Register owner berhasil
 *       400:
 *         description: Register owner gagal
 */
router.post("/register-owner", registerOwner)
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Login untuk owner, admin, atau kasir menggunakan username atau email dan password. Gunakan field usernameOrEmail untuk mengisi username atau email.
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
 *                 description: Isi dengan username atau email user.
 *                 example: owner
 *               password:
 *                 type: string
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
 *         description: Username/email atau password salah
 */
router.post("/login", login)

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Ambil profile user login
 *     description: Mengambil data profile user berdasarkan token JWT.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile berhasil diambil
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 */
router.get("/profile", authMiddleware, getProfile)

/**
 * @swagger
 * /auth/check-token:
 *   get:
 *     summary: Cek token JWT
 *     description: Mengecek apakah token JWT masih valid.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valid
 *       401:
 *         description: Token tidak valid
 */
router.get("/check-token", authMiddleware, checkToken)

module.exports = router