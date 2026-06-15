
const authService = require("./auth.service")

const {
  successResponse,
  errorResponse
} = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
| Mencegah karakter tertentu ditafsirkan sebagai HTML.
|--------------------------------------------------------------------------
*/
const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/*
|--------------------------------------------------------------------------
| RENDER ACTIVATION PAGE
|--------------------------------------------------------------------------
| Menampilkan halaman HTML saat tautan aktivasi dibuka dari email.
|--------------------------------------------------------------------------
*/
const renderActivationPage = ({
  success,
  title,
  message
}) => {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message)

  const statusColor = success
    ? "#15803d"
    : "#b91c1c"

  const statusBackground = success
    ? "#f0fdf4"
    : "#fef2f2"

  const statusBorder = success
    ? "#bbf7d0"
    : "#fecaca"

  const icon = success ? "✓" : "!"

  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>${safeTitle} - SIOPOS</title>
      </head>

      <body
        style="
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          background: #f8fafc;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <main
          style="
            width: 100%;
            max-width: 480px;
            padding: 36px;
            box-sizing: border-box;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            text-align: center;
            box-shadow: 0 14px 40px rgba(15, 23, 42, 0.10);
          "
        >
          <div
            style="
              margin-bottom: 26px;
            "
          >
            <h2
              style="
                margin: 0;
                color: #7c2d12;
                font-size: 27px;
                font-weight: 800;
              "
            >
              SIOPOS
            </h2>

            <p
              style="
                margin: 7px 0 0;
                color: #64748b;
                font-size: 13px;
              "
            >
              Aplikasi Kasir dan Manajemen Toko
            </p>
          </div>

          <div
            style="
              width: 74px;
              height: 74px;
              margin: 0 auto 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              border: 1px solid ${statusBorder};
              background: ${statusBackground};
              color: ${statusColor};
              font-size: 42px;
              font-weight: 800;
            "
          >
            ${icon}
          </div>

          <h1
            style="
              margin: 0 0 14px;
              color: #111827;
              font-size: 25px;
              line-height: 1.3;
            "
          >
            ${safeTitle}
          </h1>

          <p
            style="
              margin: 0;
              color: #64748b;
              font-size: 15px;
              line-height: 1.7;
            "
          >
            ${safeMessage}
          </p>

          ${
            success
              ? `
                <div
                  style="
                    margin-top: 28px;
                    padding: 14px 18px;
                    border-radius: 10px;
                    background: #fff7ed;
                    color: #9a3412;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  Akun sudah dapat digunakan untuk login ke aplikasi SIOPOS.
                </div>
              `
              : `
                <div
                  style="
                    margin-top: 28px;
                    padding: 14px 18px;
                    border-radius: 10px;
                    background: #f8fafc;
                    color: #475569;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  Silakan kirim ulang email aktivasi melalui aplikasi apabila
                  tautan sudah kedaluwarsa.
                </div>
              `
          }
        </main>
      </body>
    </html>
  `
}

/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Membuat akun owner baru.
| Akun berstatus nonaktif hingga email berhasil diverifikasi.
|--------------------------------------------------------------------------
*/
const registerOwner = async (req, res) => {
  try {
    const owner =
      await authService.registerOwner(
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
      error.message ||
        "Register owner gagal",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| RESEND VERIFICATION EMAIL
|--------------------------------------------------------------------------
| Mengirim ulang tautan aktivasi kepada user yang belum terverifikasi.
|--------------------------------------------------------------------------
*/
const resendVerificationEmail = async (
  req,
  res
) => {
  try {
    const result =
      await authService
        .resendVerificationEmail(
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
| Endpoint ini dibuka langsung melalui tautan pada email.
|
| GET /api/auth/verify-email?token=TOKEN
|
| Respons berupa halaman HTML, bukan JSON.
|--------------------------------------------------------------------------
*/
const verifyEmail = async (req, res) => {
  try {
    const token = String(
      req.query.token || ""
    ).trim()

    const result =
      await authService.verifyEmail(
        token
      )

    return res
      .status(200)
      .type("html")
      .send(
        renderActivationPage({
          success: true,
          title: "Aktivasi Berhasil",
          message:
            result.message ||
            "Email berhasil diverifikasi dan akun sudah aktif."
        })
      )
  } catch (error) {
    console.error(
      "VERIFY EMAIL ERROR:",
      error
    )

    return res
      .status(400)
      .type("html")
      .send(
        renderActivationPage({
          success: false,
          title: "Aktivasi Gagal",
          message:
            error.message ||
            "Tautan aktivasi tidak valid atau sudah kedaluwarsa."
        })
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
    const result =
      await authService.login(
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
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Login gagal",
      401,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
| Mengirimkan kode OTP 6 digit ke email user.
|
| Respons dibuat umum agar tidak membocorkan apakah email terdaftar.
|--------------------------------------------------------------------------
*/
const forgotPassword = async (
  req,
  res
) => {
  try {
    const result =
      await authService.forgotPassword(
        req.body
      )

    return successResponse(
      res,
      result.message ||
        "Jika email terdaftar, kode OTP reset password akan dikirim ke email",
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
        "Permintaan kode OTP reset password gagal",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
| Mengubah password menggunakan:
| - email
| - OTP 6 digit
| - password baru
| - konfirmasi password
|--------------------------------------------------------------------------
*/
const resetPassword = async (
  req,
  res
) => {
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
| Mengambil profil user berdasarkan token JWT.
|--------------------------------------------------------------------------
*/
const getProfile = async (
  req,
  res
) => {
  try {
    if (
      !req.user ||
      !req.user.id_user
    ) {
      return errorResponse(
        res,
        "Data user pada token tidak ditemukan",
        401,
        "Data user pada token tidak ditemukan"
      )
    }

    const profile =
      await authService.getProfile(
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
| Mengecek apakah JWT masih valid.
|--------------------------------------------------------------------------
*/
const checkToken = async (
  req,
  res
) => {
  try {
    if (
      !req.user ||
      !req.user.id_user
    ) {
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
          id_user:
            req.user.id_user,

          id_store:
            req.user.id_store || null,

          nama_lengkap:
            req.user.nama_lengkap || null,

          username:
            req.user.username || null,

          email:
            req.user.email || null,

          role:
            req.user.role || null
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
