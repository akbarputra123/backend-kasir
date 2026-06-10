const dashboardService = require("./dashboard.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET DASHBOARD
|--------------------------------------------------------------------------
*/
const getDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboard(
      req.user,
      req.query
    )

    return successResponse(
      res,
      "Data dashboard berhasil diambil",
      dashboard,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data dashboard",
      400,
      error.message
    )
  }
}

module.exports = {
  getDashboard
}