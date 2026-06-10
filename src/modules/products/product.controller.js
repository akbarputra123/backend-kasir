const productService = require("./product.service")
const { successResponse, errorResponse } = require("../../utils/response")

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
*/
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(
      req.body,
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
*/
const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
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
    const foto = req.file
      ? `/uploads/products/${req.file.filename}`
      : req.body.foto

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