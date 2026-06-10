const successResponse = (
  res,
  message = "Berhasil",
  data = null,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    sukses: true,
    pesan: message,
    data
  })
}

const errorResponse = (
  res,
  message = "Terjadi kesalahan",
  statusCode = 500,
  error = null
) => {
  return res.status(statusCode).json({
    sukses: false,
    pesan: message,
    error: process.env.NODE_ENV === "development" ? error : null
  })
}

module.exports = {
  successResponse,
  errorResponse
}