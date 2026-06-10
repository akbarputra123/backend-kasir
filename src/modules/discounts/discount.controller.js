const discountService = require("./discount.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET ALL DISCOUNTS
|--------------------------------------------------------------------------
*/
const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getAllDiscounts(req.user)

    return successResponse(
      res,
      "Data diskon berhasil diambil",
      discounts,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data diskon",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET DISCOUNT BY ID
|--------------------------------------------------------------------------
*/
const getDiscountById = async (req, res) => {
  try {
    const discount = await discountService.getDiscountById(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Detail diskon berhasil diambil",
      discount,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil detail diskon",
      404,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE DISCOUNT
|--------------------------------------------------------------------------
*/
const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Diskon berhasil ditambahkan",
      discount,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menambahkan diskon",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE DISCOUNT
|--------------------------------------------------------------------------
*/
const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(
      req.params.id,
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Diskon berhasil diperbarui",
      discount,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui diskon",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DELETE DISCOUNT
|--------------------------------------------------------------------------
*/
const deleteDiscount = async (req, res) => {
  try {
    const result = await discountService.deleteDiscount(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Diskon berhasil dihapus",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menghapus diskon",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DEACTIVATE DISCOUNT
|--------------------------------------------------------------------------
*/
const deactivateDiscount = async (req, res) => {
  try {
    const discount = await discountService.deactivateDiscount(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Diskon berhasil dinonaktifkan",
      discount,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menonaktifkan diskon",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  deactivateDiscount
}