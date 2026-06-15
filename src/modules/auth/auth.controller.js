
const authService = require("./auth.service")

const {
  successResponse,
  errorResponse
} = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Membuat akun owner pertama.
| Akun akan dibuat dengan status nonaktif sampai email diverifikasi.
|--------------------------------------------------------------------------
*/
const registerOwner = async (req, res) => {
  try {
    const owner = await authService.registerOwner(
      req.body
    )

    const message = owner.email_sent
      ? "Register owner berhasil. Silakan periksa email untuk mengaktifkan akun"
      : "Register owner berhasil, tetapi email aktivasi gagal dikirim"

    return successResponse(
      res,
      message,
      owner,
      201
    )
  } catch (error) {
    console.error(
      "REGISTER OWNER ERROR:",
      error
    )

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
| RESEND VERIFICATION EMAIL
|--------------------------------------------------------------------------
| Mengirim ulang tautan aktivasi ke email user yang belum diverifikasi.
|--------------------------------------------------------------------------
*/
const resendVerificationEmail = async (
  req,
  res
) => {
  try {
    const result =
      await authService.resendVerificationEmail(
        req.body
      )

    return successResponse(
      res,
      result.message ||
        "Jika email terdaftar dan belum aktif, tautan aktivasi akan dikirim",
      null,
      200
    )
  } catch (error) {
    console.error(
      "RESEND VERIFICATION ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal mengirim ulang email aktivasi",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
| Memverifikasi token aktivasi yang dikirim melalui email.
|
| Token dapat dikirim melalui:
| GET /auth/verify-email?token=TOKEN
|--------------------------------------------------------------------------
*/
const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token

    const result =
      await authService.verifyEmail(token)

    return successResponse(
      res,
      result.message ||
        "Email berhasil diverifikasi",
      result,
      200
    )
  } catch (error) {
    console.error(
      "VERIFY EMAIL ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Verifikasi email gagal",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
| Login owner, admin, atau kasir menggunakan username/email dan password.
|--------------------------------------------------------------------------
*/
const login = async (req, res) => {
  try {
    const result = await authService.login(
      req.body
    )

    return successResponse(
      res,
      "Login berhasil",
      result,
      200
    )
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error.message
    )

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
| FORGOT PASSWORD
|--------------------------------------------------------------------------
| Mengirimkan tautan reset password ke email user.
|
| Respons sengaja dibuat umum agar tidak membocorkan apakah email terdaftar.
|--------------------------------------------------------------------------
*/
const forgotPassword = async (req, res) => {
  try {
    const result =
      await authService.forgotPassword(
        req.body
      )

    return successResponse(
      res,
      result.message ||
        "Jika email terdaftar, tautan reset password akan dikirim",
      null,
      200
    )
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Permintaan reset password gagal",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
| Mengubah password berdasarkan token reset yang dikirim melalui email.
|--------------------------------------------------------------------------
*/
const resetPassword = async (req, res) => {
  try {
    const result =
      await authService.resetPassword(
        req.body
      )

    return successResponse(
      res,
      result.message ||
        "Password berhasil diubah",
      null,
      200
    )
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Reset password gagal",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET PROFILE
|--------------------------------------------------------------------------
| Mengambil profil user yang sedang login berdasarkan token JWT.
|--------------------------------------------------------------------------
*/
const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id_user) {
      return errorResponse(
        res,
        "Data user pada token tidak ditemukan",
        401,
        "Data user pada token tidak ditemukan"
      )
    }

    const profile = await authService.getProfile(
      req.user.id_user
    )

    return successResponse(
      res,
      "Profile berhasil diambil",
      profile,
      200
    )
  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal mengambil profile",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CHECK TOKEN
|--------------------------------------------------------------------------
| Mengecek apakah token JWT yang digunakan masih valid.
|--------------------------------------------------------------------------
*/
const checkToken = async (req, res) => {
  try {
    if (!req.user || !req.user.id_user) {
      return errorResponse(
        res,
        "Token tidak valid",
        401,
        "Data user pada token tidak ditemukan"
      )
    }

    return successResponse(
      res,
      "Token valid",
      {
        user: {
          id_user: req.user.id_user,
          id_store: req.user.id_store || null,
          nama_lengkap:
            req.user.nama_lengkap || null,
          username:
            req.user.username || null,
          email: req.user.email || null,
          role: req.user.role
        }
      },
      200
    )
  } catch (error) {
    console.error(
      "CHECK TOKEN ERROR:",
      error
    )

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
  resendVerificationEmail,
  verifyEmail,

  login,

  forgotPassword,
  resetPassword,

  getProfile,
  checkToken
}
