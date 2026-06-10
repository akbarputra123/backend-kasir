const stockLogService = require("./stockLog.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET ALL STOCK LOGS
|--------------------------------------------------------------------------
*/
const getAllStockLogs = async (req, res) => {
  try {
    const logs = await stockLogService.getAllStockLogs(req.user)

    return successResponse(
      res,
      "Riwayat stok berhasil diambil",
      logs,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil riwayat stok",
      500,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET STOCK LOGS BY PRODUCT
|--------------------------------------------------------------------------
*/
const getStockLogsByProduct = async (req, res) => {
  try {
    const logs = await stockLogService.getStockLogsByProduct(
      req.params.id_product,
      req.user
    )

    return successResponse(
      res,
      "Riwayat stok produk berhasil diambil",
      logs,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil riwayat stok produk",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| STOCK IN
|--------------------------------------------------------------------------
*/
const stockIn = async (req, res) => {
  try {
    const result = await stockLogService.stockIn(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Stok masuk berhasil disimpan",
      result,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menyimpan stok masuk",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| STOCK OUT
|--------------------------------------------------------------------------
*/
const stockOut = async (req, res) => {
  try {
    const result = await stockLogService.stockOut(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Stok keluar berhasil disimpan",
      result,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menyimpan stok keluar",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| STOCK ADJUSTMENT
|--------------------------------------------------------------------------
*/
const stockAdjustment = async (req, res) => {
  try {
    const result = await stockLogService.stockAdjustment(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Penyesuaian stok berhasil disimpan",
      result,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menyimpan penyesuaian stok",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllStockLogs,
  getStockLogsByProduct,
  stockIn,
  stockOut,
  stockAdjustment
}