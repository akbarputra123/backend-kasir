
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
| VALIDATE EMAIL
|--------------------------------------------------------------------------
*/
const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return pattern.test(email)
}

/*
|--------------------------------------------------------------------------
| VALIDATE MAIL RESULT
|--------------------------------------------------------------------------
| Memastikan server SMTP menerima alamat email tujuan.
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

  const recipientAccepted = accepted.includes(
    normalizedRecipient
  )

  console.log("")
  console.log("==============================================")
  console.log(`📧 HASIL PENGIRIMAN ${mailType}`)
  console.log("==============================================")
  console.log(`Message ID : ${result.messageId || "-"}`)
  console.log(`Tujuan     : ${normalizedRecipient}`)
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
  console.log(`Response   : ${result.response || "-"}`)
  console.log(
    "Envelope   :",
    result.envelope || "-"
  )
  console.log("==============================================")
  console.log("")

  if (!recipientAccepted) {
    throw new Error(
      `Server SMTP tidak menerima email tujuan ${normalizedRecipient}`
    )
  }

  if (rejected.includes(normalizedRecipient)) {
    throw new Error(
      `Email tujuan ditolak oleh server SMTP: ${normalizedRecipient}`
    )
  }

  return {
    accepted,
    rejected
  }
}

/*
|--------------------------------------------------------------------------
| SEND VERIFICATION EMAIL
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

  const appUrl = String(
    process.env.APP_URL ||
    "http://localhost:2000/api"
  ).replace(/\/+$/, "")

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
      `Aktifkan akun SIOPOS melalui tautan berikut: ${verificationUrl}`,
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
    message_id: result.messageId || null,
    email: recipient,
    accepted: mailResult.accepted,
    rejected: mailResult.rejected,
    response: result.response || null,
    verification_url: verificationUrl
  }
}

/*
|--------------------------------------------------------------------------
| SEND RESET PASSWORD EMAIL
|--------------------------------------------------------------------------
*/
const sendResetPasswordEmail = async ({
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
      "Email penerima reset password wajib diisi"
    )
  }

  if (!validateEmail(recipient)) {
    throw new Error(
      "Format email penerima reset password tidak valid"
    )
  }

  if (!rawToken) {
    throw new Error(
      "Token reset password tidak ditemukan"
    )
  }

  const frontendUrl = String(
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "")

  const resetUrl =
    `${frontendUrl}/reset-password` +
    `?token=${encodeURIComponent(rawToken)}`

  const template =
    getResetPasswordEmailTemplate({
      nama_lengkap: name,
      resetUrl
    })

  if (
    !template ||
    !template.subject ||
    !template.html
  ) {
    throw new Error(
      "Template email reset password tidak valid"
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
      `Reset password SIOPOS melalui tautan berikut: ${resetUrl}`,
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
    mailType: "EMAIL RESET PASSWORD"
  })

  return {
    success: true,
    message_id: result.messageId || null,
    email: recipient,
    accepted: mailResult.accepted,
    rejected: mailResult.rejected,
    response: result.response || null,
    reset_url: resetUrl
  }
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail
}
