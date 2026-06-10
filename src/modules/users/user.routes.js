const express = require("express")

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
} = require("./user.controller")

const {
  authMiddleware,
  authorizeRoles
} = require("../../middlewares/authMiddleware")

const router = express.Router()

/*
|--------------------------------------------------------------------------
| USER ROUTES
|--------------------------------------------------------------------------
| Base endpoint:
| /api/users
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ambil semua data user
 *     description: Owner melihat semua user pada toko miliknya. Admin melihat user pada toko yang sama.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 */
router.get(
  "/",
  authMiddleware,
  authorizeRoles("owner", "admin"),
  getAllUsers
)

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Ambil detail user
 *     description: Owner hanya dapat melihat user yang berada di toko miliknya. Admin hanya dapat melihat user pada toko yang sama.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user
 *     responses:
 *       200:
 *         description: Detail user berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 *       404:
 *         description: User tidak ditemukan
 */
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("owner", "admin"),
  getUserById
)

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tambah user admin/kasir ke toko
 *     description: Owner menambahkan akun admin atau kasir dan menghubungkannya ke toko milik owner.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_store
 *               - nama_lengkap
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               id_store:
 *                 type: integer
 *                 example: 1
 *               nama_lengkap:
 *                 type: string
 *                 example: Kasir SIOPOS
 *               username:
 *                 type: string
 *                 example: kasir
 *               email:
 *                 type: string
 *                 example: kasir@siopos.com
 *               no_hp:
 *                 type: string
 *                 example: "081234567891"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [admin, kasir]
 *                 example: kasir
 *               status_akun:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       201:
 *         description: User berhasil ditambahkan
 *       400:
 *         description: Gagal menambahkan user
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  createUser
)

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user admin/kasir
 *     description: Owner memperbarui data admin atau kasir, termasuk memindahkan user ke toko lain milik owner.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_store
 *               - nama_lengkap
 *               - username
 *               - email
 *               - role
 *               - status_akun
 *             properties:
 *               id_store:
 *                 type: integer
 *                 example: 1
 *               nama_lengkap:
 *                 type: string
 *                 example: Kasir SIOPOS Update
 *               username:
 *                 type: string
 *                 example: kasir
 *               email:
 *                 type: string
 *                 example: kasir@siopos.com
 *               no_hp:
 *                 type: string
 *                 example: "081234567891"
 *               role:
 *                 type: string
 *                 enum: [admin, kasir]
 *                 example: kasir
 *               status_akun:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: aktif
 *     responses:
 *       200:
 *         description: User berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui user
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 */
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  updateUser
)

/**
 * @swagger
 * /users/{id}/password:
 *   put:
 *     summary: Update password user
 *     description: Owner memperbarui password admin atau kasir yang berada pada toko miliknya.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: "123456"
 *               konfirmasi_password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Password user berhasil diperbarui
 *       400:
 *         description: Gagal memperbarui password user
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 */
router.put(
  "/:id/password",
  authMiddleware,
  authorizeRoles("owner"),
  updateUserPassword
)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Hapus user
 *     description: Owner menghapus akun admin atau kasir yang berada pada toko miliknya.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 *       400:
 *         description: Gagal menghapus user
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses
 */
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  deleteUser
)

module.exports = router