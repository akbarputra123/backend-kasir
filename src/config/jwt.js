const jwt = require("jsonwebtoken")
require("dotenv").config()

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diatur di file .env")
}

/*
|--------------------------------------------------------------------------
| GENERATE TOKEN
|--------------------------------------------------------------------------
| Membuat token JWT ketika user berhasil login
|--------------------------------------------------------------------------
*/
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/*
|--------------------------------------------------------------------------
| VERIFY TOKEN
|--------------------------------------------------------------------------
| Mengecek apakah token valid atau tidak
|--------------------------------------------------------------------------
*/
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = {
  generateToken,
  verifyToken
}