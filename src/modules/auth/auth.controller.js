const authService = require("./auth.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Endpoint untuk membuat akun owner pertama SIOPOS.
|--------------------------------------------------------------------------
*/
const registerOwner = async (req, res) => {
  try {
    const owner = await authService.registerOwner(req.body)

    return successResponse(
      res,
      "Register owner berhasil",
      owner,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Register owner gagal",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
| Endpoint untuk login owner/admin/kasir.
|--------------------------------------------------------------------------
*/
const login = async (req, res) => {
  try {
    const result = await authService.login(req.body)

    return successResponse(
      res,
      "Login berhasil",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Login gagal",
      401,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
| Endpoint untuk mengambil data user yang sedang login.
|--------------------------------------------------------------------------
*/
const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id_user)

    return successResponse(
      res,
      "Profile berhasil diambil",
      profile,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil profile",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CHECK TOKEN
|--------------------------------------------------------------------------
| Endpoint sederhana untuk mengecek token masih valid.
|--------------------------------------------------------------------------
*/
const checkToken = async (req, res) => {
  try {
    return successResponse(
      res,
      "Token valid",
      {
        user: req.user
      },
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      "Token tidak valid",
      401,
      error.message
    )
  }
}

module.exports = {
  registerOwner,
  login,
  getProfile,
  checkToken
}