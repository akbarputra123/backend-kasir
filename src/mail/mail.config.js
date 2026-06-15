
const nodemailer = require("nodemailer")

/*
|--------------------------------------------------------------------------
| MAIL ENVIRONMENT
|--------------------------------------------------------------------------
*/
const MAIL_HOST = process.env.MAIL_HOST
const MAIL_PORT = Number(
  process.env.MAIL_PORT || 465
)

const MAIL_SECURE =
  String(process.env.MAIL_SECURE)
    .toLowerCase() === "true"

const MAIL_USER = process.env.MAIL_USER
const MAIL_PASSWORD =
  process.env.MAIL_PASSWORD

/*
|--------------------------------------------------------------------------
| MAIL TRANSPORTER
|--------------------------------------------------------------------------
*/
const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_SECURE,

  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
})

/*
|--------------------------------------------------------------------------
| VERIFY MAIL CONFIGURATION
|--------------------------------------------------------------------------
*/
const validateMailEnvironment = () => {
  const missingVariables = []

  if (!MAIL_HOST) {
    missingVariables.push("MAIL_HOST")
  }

  if (!MAIL_USER) {
    missingVariables.push("MAIL_USER")
  }

  if (!MAIL_PASSWORD) {
    missingVariables.push("MAIL_PASSWORD")
  }

  if (missingVariables.length > 0) {
    throw new Error(
      `Konfigurasi email belum lengkap: ${missingVariables.join(", ")}`
    )
  }
}

/*
|--------------------------------------------------------------------------
| VERIFY MAIL CONNECTION
|--------------------------------------------------------------------------
*/
const verifyMailConnection = async () => {
  try {
    validateMailEnvironment()

    await transporter.verify()

    console.log("✅ Mail server berhasil terhubung")
    console.log(`📧 Email pengirim: ${MAIL_USER}`)

    return true
  } catch (error) {
    console.error(
      "❌ Mail server gagal terhubung:",
      error.message
    )

    return false
  }
}

module.exports = {
  transporter,
  verifyMailConnection
}
