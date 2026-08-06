const express = require("express")

const router = express.Router()

const variantController = require("./variant.controller")

const {
  authMiddleware,
  authorizeRoles
} = require("../../middlewares/authMiddleware")

const {
  subscriptionMiddleware
} = require("../../middlewares/subscriptionMiddleware")

/**
 * @swagger
 * tags:
 *   name: Variants
 *   description: Manajemen varian produk Coffee Shop/Kedai
 */

/*
|--------------------------------------------------------------------------
| VARIANT GROUP
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /variants/product/{id_product}:
 *   get:
 *     summary: Ambil seluruh group beserta option varian berdasarkan produk
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_product
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Berhasil mengambil data varian
 *       400:
 *         description: Produk tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/product/:id_product",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin", "kasir"),
  variantController.getGroupsByProduct
)

/**
 * @swagger
 * /variants/group:
 *   post:
 *     summary: Tambah group varian
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_product
 *               - nama_group
 *             properties:
 *               id_product:
 *                 type: integer
 *                 example: 1
 *               nama_group:
 *                 type: string
 *                 example: Ukuran
 *               min_select:
 *                 type: integer
 *                 example: 1
 *               max_select:
 *                 type: integer
 *                 example: 1
 *               status_group:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *     responses:
 *       201:
 *         description: Group varian berhasil ditambahkan
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/group",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  variantController.createGroup
)

/**
 * @swagger
 * /variants/group/{id_variant_group}:
 *   put:
 *     summary: Update group varian
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_variant_group
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_group:
 *                 type: string
 *                 example: Ukuran
 *               min_select:
 *                 type: integer
 *                 example: 1
 *               max_select:
 *                 type: integer
 *                 example: 2
 *               status_group:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *     responses:
 *       200:
 *         description: Group varian berhasil diperbarui
 *       400:
 *         description: Group varian tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/group/:id_variant_group",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  variantController.updateGroup
)

/**
 * @swagger
 * /variants/group/{id_variant_group}:
 *   delete:
 *     summary: Hapus group varian
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_variant_group
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Group varian berhasil dihapus
 *       400:
 *         description: Group varian tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/group/:id_variant_group",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  variantController.deleteGroup
)

/*
|--------------------------------------------------------------------------
| VARIANT OPTION
|--------------------------------------------------------------------------
*/

/**
 * @swagger
 * /variants/option:
 *   post:
 *     summary: Tambah option varian
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_variant_group
 *               - nama_option
 *             properties:
 *               id_variant_group:
 *                 type: integer
 *                 example: 1
 *               nama_option:
 *                 type: string
 *                 example: Large
 *               tambahan_harga:
 *                 type: number
 *                 example: 5000
 *               status_option:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *     responses:
 *       201:
 *         description: Option varian berhasil ditambahkan
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/option",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  variantController.createOption
)

/**
 * @swagger
 * /variants/option/{id_variant_option}:
 *   put:
 *     summary: Update option varian
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_variant_option
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_option:
 *                 type: string
 *                 example: Jumbo
 *               tambahan_harga:
 *                 type: number
 *                 example: 10000
 *               status_option:
 *                 type: string
 *                 enum:
 *                   - aktif
 *                   - nonaktif
 *                 example: aktif
 *     responses:
 *       200:
 *         description: Option varian berhasil diperbarui
 *       400:
 *         description: Option varian tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/option/:id_variant_option",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  variantController.updateOption
)

/**
 * @swagger
 * /variants/option/{id_variant_option}:
 *   delete:
 *     summary: Hapus option varian
 *     tags: [Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_variant_option
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Option varian berhasil dihapus
 *       400:
 *         description: Option varian tidak ditemukan
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/option/:id_variant_option",
  authMiddleware,
  subscriptionMiddleware,
  authorizeRoles("owner", "admin"),
  variantController.deleteOption
)

module.exports = router