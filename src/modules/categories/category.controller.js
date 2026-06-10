const categoryService = require("./category.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET ALL CATEGORIES
|--------------------------------------------------------------------------
*/
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(req.user)

    return successResponse(
      res,
      "Data kategori berhasil diambil",
      categories,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data kategori",
      500,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET CATEGORY BY ID
|--------------------------------------------------------------------------
*/
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Detail kategori berhasil diambil",
      category,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil detail kategori",
      404,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE CATEGORY
|--------------------------------------------------------------------------
*/
const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Kategori berhasil ditambahkan",
      category,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menambahkan kategori",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE CATEGORY
|--------------------------------------------------------------------------
*/
const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Kategori berhasil diperbarui",
      category,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui kategori",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
*/
const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Kategori berhasil dihapus",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menghapus kategori",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}