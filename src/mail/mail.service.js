
const {
  transporter
} = require("./mail.config")

const {
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate
} = require("./mail.template")

/*
|--------------------------------------------------------------------------
| GET SENDER
|--------------------------------------------------------------------------
| Mengambil nama dan alamat email pengirim dari environment.
|--------------------------------------------------------------------------
*/
const getSender = () => {
  const name =
    process.env.MAIL_FROM_NAME ||
    process.env.APP_NAME ||
    "SIOPOS"

  const address =
    process.env.MAIL_FROM_ADDRESS ||
    process.env.MAIL_USER

  if (!address) {
    throw new Error(
      "MAIL_FROM_ADDRESS atau MAIL_USER belum dikonfigurasi"
    )
  }

  return {
    name,
    address
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE EMAIL
|--------------------------------------------------------------------------
*/
const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase()
}

/*
|--------------------------------------------------------------------------
| VALIDATE EMAIL FORMAT
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return pattern.test(email)
}

/*
|--------------------------------------------------------------------------
| GET PUBLIC API URL
|--------------------------------------------------------------------------
| APP_URL wajib berupa URL backend publik.
|
| Contoh:
| APP_URL=http://76.13.197.9:2000/api
|--------------------------------------------------------------------------
*/
const getPublicApiUrl = () => {
  const appUrl = String(
    process.env.APP_URL || ""
  )
    .trim()
    .replace(/\/+$/, "")

  if (!appUrl) {
    throw new Error(
      "APP_URL belum dikonfigurasi pada file .env"
    )
  }

  if (
    !appUrl.startsWith("http://") &&
    !appUrl.startsWith("https://")
  ) {
    throw new Error(
      "APP_URL harus diawali http:// atau https://"
    )
  }

  return appUrl
}

/*
|--------------------------------------------------------------------------
| VALIDATE MAIL RESULT
|--------------------------------------------------------------------------
| Memastikan alamat penerima diterima oleh server SMTP.
|--------------------------------------------------------------------------
*/
const validateMailResult = ({
  result,
  recipient,
  mailType
}) => {
  const accepted = Array.isArray(result.accepted)
    ? result.accepted.map((item) =>
        normalizeEmail(item)
      )
    : []

  const rejected = Array.isArray(result.rejected)
    ? result.rejected.map((item) =>
        normalizeEmail(item)
      )
    : []

  const normalizedRecipient =
    normalizeEmail(recipient)

  const recipientAccepted =
    accepted.includes(normalizedRecipient)

  const recipientRejected =
    rejected.includes(normalizedRecipient)

  console.log("")
  console.log("==============================================")
  console.log(`📧 HASIL PENGIRIMAN ${mailType}`)
  console.log("==============================================")
  console.log(
    `Message ID : ${result.messageId || "-"}`
  )
  console.log(
    `Tujuan     : ${normalizedRecipient}`
  )
  console.log(
    `Accepted   : ${
      accepted.length > 0
        ? accepted.join(", ")
        : "-"
    }`
  )
  console.log(
    `Rejected   : ${
      rejected.length > 0
        ? rejected.join(", ")
        : "-"
    }`
  )
  console.log(
    `Response   : ${result.response || "-"}`
  )
  console.log(
    "Envelope   :",
    result.envelope || "-"
  )
  console.log("==============================================")
  console.log("")

  if (recipientRejected) {
    throw new Error(
      `Email tujuan ditolak oleh server SMTP: ${normalizedRecipient}`
    )
  }

  if (!recipientAccepted) {
    throw new Error(
      `Server SMTP tidak menerima email tujuan: ${normalizedRecipient}`
    )
  }

  return {
    accepted,
    rejected,
    response: result.response || null,
    message_id: result.messageId || null
  }
}

/*
|--------------------------------------------------------------------------
| SEND VERIFICATION EMAIL
|--------------------------------------------------------------------------
| Mengirim tautan aktivasi akun.
|--------------------------------------------------------------------------
*/
const sendVerificationEmail = async ({
  email,
  nama_lengkap,
  token
}) => {
  const recipient = normalizeEmail(email)

  const name = String(
    nama_lengkap || "Pengguna SIOPOS"
  ).trim()

  const rawToken = String(token || "").trim()

  if (!recipient) {
    throw new Error(
      "Email penerima aktivasi wajib diisi"
    )
  }

  if (!validateEmail(recipient)) {
    throw new Error(
      "Format email penerima aktivasi tidak valid"
    )
  }

  if (!rawToken) {
    throw new Error(
      "Token aktivasi tidak ditemukan"
    )
  }

  const appUrl = getPublicApiUrl()

  const verificationUrl =
    `${appUrl}/auth/verify-email` +
    `?token=${encodeURIComponent(rawToken)}`

  const template =
    getVerificationEmailTemplate({
      nama_lengkap: name,
      verificationUrl
    })

  if (
    !template ||
    !template.subject ||
    !template.html
  ) {
    throw new Error(
      "Template email aktivasi tidak valid"
    )
  }

  const result = await transporter.sendMail({
    from: getSender(),
    to: recipient,

    replyTo:
      process.env.MAIL_FROM_ADDRESS ||
      process.env.MAIL_USER,

    subject: template.subject,

    text:
      template.text ||
      (
        `Halo ${name},\n\n` +
        `Aktifkan akun SIOPOS melalui tautan berikut:\n` +
        `${verificationUrl}`
      ),

    html: template.html,

    headers: {
      "X-Mailer": "SIOPOS Backend",
      "X-Application": "SIOPOS",
      "X-Priority": "3"
    }
  })

  const mailResult = validateMailResult({
    result,
    recipient,
    mailType: "EMAIL AKTIVASI"
  })

  return {
    success: true,
    email: recipient,
    message_id: mailResult.message_id,
    accepted: mailResult.accepted,
    rejected: mailResult.rejected,
    response: mailResult.response
  }
}

/*
|--------------------------------------------------------------------------
| SEND RESET PASSWORD OTP
|--------------------------------------------------------------------------
| Mengirim kode OTP 6 digit untuk reset password.
|
| Parameter yang diterima:
| - email
| - nama_lengkap
| - otp
|--------------------------------------------------------------------------
*/
const sendResetPasswordEmail = async ({
  email,
  nama_lengkap,
  otp
}) => {
  const recipient = normalizeEmail(email)

  const name = String(
    nama_lengkap || "Pengguna SIOPOS"
  ).trim()

  const otpValue = String(otp || "").trim()

  if (!recipient) {
    throw new Error(
      "Email penerima reset password wajib diisi"
    )
  }

  if (!validateEmail(recipient)) {
    throw new Error(
      "Format email penerima reset password tidak valid"
    )
  }

  if (!otpValue) {
    throw new Error(
      "Kode OTP reset password tidak ditemukan"
    )
  }

  if (!/^\d{6}$/.test(otpValue)) {
    throw new Error(
      "Kode OTP reset password harus terdiri dari 6 digit"
    )
  }

  const template =
    getResetPasswordEmailTemplate({
      nama_lengkap: name,
      otp: otpValue
    })

  if (
    !template ||
    !template.subject ||
    !template.html
  ) {
    throw new Error(
      "Template email OTP reset password tidak valid"
    )
  }

  const result = await transporter.sendMail({
    from: getSender(),
    to: recipient,

    replyTo:
      process.env.MAIL_FROM_ADDRESS ||
      process.env.MAIL_USER,

    subject: template.subject,

    text:
      template.text ||
      (
        `Halo ${name},\n\n` +
        `Kode OTP reset password SIOPOS Anda adalah:\n\n` +
        `${otpValue}\n\n` +
        `Kode berlaku selama 10 menit.\n` +
        `Jangan berikan kode OTP kepada siapa pun.`
      ),

    html: template.html,

    headers: {
      "X-Mailer": "SIOPOS Backend",
      "X-Application": "SIOPOS",
      "X-Priority": "3"
    }
  })

  const mailResult = validateMailResult({
    result,
    recipient,
    mailType: "OTP RESET PASSWORD"
  })

  return {
    success: true,
    email: recipient,
    message_id: mailResult.message_id,
    accepted: mailResult.accepted,
    rejected: mailResult.rejected,
    response: mailResult.response
  }
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail
}