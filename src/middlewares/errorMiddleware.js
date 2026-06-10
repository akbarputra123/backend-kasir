const { errorResponse } = require("../utils/response")

const notFound = (req, res, next) => {
  return errorResponse(
    res,
    `Route ${req.originalUrl} tidak ditemukan`,
    404
  )
}

const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err)

  return errorResponse(
    res,
    err.message || "Terjadi kesalahan server",
    err.statusCode || 500,
    err.stack
  )
}

module.exports = {
  notFound,
  errorHandler
}