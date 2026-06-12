const productService = require("./product.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| BUILD FOTO PATH
|--------------------------------------------------------------------------
| Jika ada file dari multer, simpan path relatif ke database.
|--------------------------------------------------------------------------
*/
const buildFotoPath = (req) => {
  if (req.file) {
    return `/uploads/products/${req.file.filename}`
  }

  if (req.body && req.body.foto) {
    return req.body.foto
  }

  return null
}

/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/
const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts(req.user)

    return successResponse(
      res,
      "Data produk berhasil diambil",
      products,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data produk",
      500,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT BY ID
|--------------------------------------------------------------------------
*/
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Detail produk berhasil diambil",
      product,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil detail produk",
      404,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
| Mendukung:
| - application/json
| - multipart/form-data dengan field file: foto
|--------------------------------------------------------------------------
*/
const createProduct = async (req, res) => {
  try {
    const foto = buildFotoPath(req)

    const product = await productService.createProduct(
      {
        ...req.body,
        foto
      },
      req.user
    )

    return successResponse(
      res,
      "Produk berhasil ditambahkan",
      product,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menambahkan produk",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
| Mendukung:
| - application/json
| - multipart/form-data dengan field file: foto
|--------------------------------------------------------------------------
*/
const updateProduct = async (req, res) => {
  try {
    const foto = buildFotoPath(req)

    const product = await productService.updateProduct(
      req.params.id,
      {
        ...req.body,
        foto
      },
      req.user
    )

    return successResponse(
      res,
      "Produk berhasil diperbarui",
      product,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui produk",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT FOTO
|--------------------------------------------------------------------------
*/
const updateProductFoto = async (req, res) => {
  try {
    const foto = buildFotoPath(req)

    if (!foto) {
      return errorResponse(
        res,
        "Foto produk wajib diisi",
        400,
        "Foto produk wajib diisi"
      )
    }

    const product = await productService.updateProductFoto(
      req.params.id,
      foto,
      req.user
    )

    return successResponse(
      res,
      "Foto produk berhasil diperbarui",
      product,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui foto produk",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/
const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Produk berhasil dihapus",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menghapus produk",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductFoto,
  deleteProduct
}