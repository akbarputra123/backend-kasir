const reportService = require("./report.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET SUMMARY
|--------------------------------------------------------------------------
*/
const getSummary = async (req, res) => {
  try {
    const summary = await reportService.getSummary(
      req.query,
      req.user
    )

    return successResponse(
      res,
      "Ringkasan laporan berhasil diambil",
      summary,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil ringkasan laporan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET DAILY REPORT
|--------------------------------------------------------------------------
*/
const getDailyReport = async (req, res) => {
  try {
    const report = await reportService.getDailyReport(
      req.query,
      req.user
    )

    return successResponse(
      res,
      "Laporan harian berhasil diambil",
      report,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil laporan harian",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET MONTHLY REPORT
|--------------------------------------------------------------------------
*/
const getMonthlyReport = async (req, res) => {
  try {
    const report = await reportService.getMonthlyReport(
      req.query,
      req.user
    )

    return successResponse(
      res,
      "Laporan bulanan berhasil diambil",
      report,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil laporan bulanan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET TOP PRODUCTS
|--------------------------------------------------------------------------
*/
const getTopProducts = async (req, res) => {
  try {
    const products = await reportService.getTopProducts(
      req.query,
      req.user
    )

    return successResponse(
      res,
      "Produk terlaris berhasil diambil",
      products,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil produk terlaris",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await reportService.getRecentTransactions(
      req.query,
      req.user
    )

    return successResponse(
      res,
      "Transaksi terakhir berhasil diambil",
      transactions,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil transaksi terakhir",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET LOW STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
const getLowStockProducts = async (req, res) => {
  try {
    const products = await reportService.getLowStockProducts(req.user)

    return successResponse(
      res,
      "Produk stok menipis berhasil diambil",
      products,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil produk stok menipis",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET DASHBOARD REPORT
|--------------------------------------------------------------------------
*/
const getDashboardReport = async (req, res) => {
  try {
    const dashboard = await reportService.getDashboardReport(
      req.query,
      req.user
    )

    return successResponse(
      res,
      "Data dashboard laporan berhasil diambil",
      dashboard,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data dashboard laporan",
      400,
      error.message
    )
  }
}

module.exports = {
  getSummary,
  getDailyReport,
  getMonthlyReport,
  getTopProducts,
  getRecentTransactions,
  getLowStockProducts,
  getDashboardReport
}