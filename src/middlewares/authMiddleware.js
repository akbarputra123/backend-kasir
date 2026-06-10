const { verifyToken } = require("../config/jwt")
const { errorResponse } = require("../utils/response")

/*
|--------------------------------------------------------------------------
| NORMALIZE ROLE
|--------------------------------------------------------------------------
*/
const normalizeRole = (role) => {
  const value = String(role || "")
    .toLowerCase()
    .trim()

  if (value === "owner") return "owner"
  if (value === "admin") return "admin"
  if (value === "kasir") return "kasir"
  if (value === "cashier") return "kasir"

  return ""
}

/*
|--------------------------------------------------------------------------
| AUTH MIDDLEWARE
|--------------------------------------------------------------------------
*/
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return errorResponse(
        res,
        "Token tidak ditemukan. Silakan login terlebih dahulu",
        401
      )
    }

    const tokenParts = authHeader.split(" ")

    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return errorResponse(
        res,
        "Format token tidak valid. Gunakan format: Bearer token",
        401
      )
    }

    const token = tokenParts[1]
    const decoded = verifyToken(token)

    const role = normalizeRole(
      decoded.role ||
        decoded.peran ||
        decoded.level ||
        decoded.tipe_user
    )

    req.user = {
      ...decoded,
      role
    }

    console.log("====================================")
    console.log("DECODED TOKEN:", req.user)
    console.log("====================================")

    next()
  } catch (error) {
    return errorResponse(
      res,
      "Token tidak valid atau sudah kedaluwarsa",
      401,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| AUTHORIZE ROLES
|--------------------------------------------------------------------------
*/
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        "User belum terautentikasi",
        401
      )
    }

    const userRole = normalizeRole(req.user.role)
    const allowedRoles = roles.map((role) => normalizeRole(role))

    console.log("====================================")
    console.log("ROLE USER:", userRole)
    console.log("ROLE DIIZINKAN:", allowedRoles)
    console.log("====================================")

    if (!userRole || !allowedRoles.includes(userRole)) {
      return errorResponse(
        res,
        "Anda tidak memiliki akses ke fitur ini",
        403
      )
    }

    req.user.role = userRole

    next()
  }
}

module.exports = {
  authMiddleware,
  authorizeRoles
}