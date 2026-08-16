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
  const pattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return pattern.test(email)
}

/*
|--------------------------------------------------------------------------
| GET PUBLIC API URL
|--------------------------------------------------------------------------
| APP_URL harus berupa URL backend publik.
|
| Production:
| APP_URL=https://api.kasir.siodev.sbs/api
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
*/
const validateMailResult = ({
  result,
  recipient,
  mailType
}) => {
  const accepted = Array.isArray(
    result.accepted
  )
    ? result.accepted.map((item) =>
        normalizeEmail(item)
      )
    : []

  const rejected = Array.isArray(
    result.rejected
  )
    ? result.rejected.map((item) =>
        normalizeEmail(item)
      )
    : []

  const normalizedRecipient =
    normalizeEmail(recipient)

  const recipientAccepted =
    accepted.includes(
      normalizedRecipient
    )

  const recipientRejected =
    rejected.includes(
      normalizedRecipient
    )

  console.log("")
  console.log(
    "=============================================="
  )
  console.log(
    `📧 HASIL PENGIRIMAN ${mailType}`
  )
  console.log(
    "=============================================="
  )

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
    `Response   : ${
      result.response || "-"
    }`
  )

  console.log(
    "Envelope   :",
    result.envelope || "-"
  )

  console.log(
    "=============================================="
  )
  console.log("")

  /*
  |--------------------------------------------------------------------------
  | SMTP MENOLAK PENERIMA
  |--------------------------------------------------------------------------
  */
  if (recipientRejected) {
    throw new Error(
      `Email tujuan ditolak oleh server SMTP: ${normalizedRecipient}`
    )
  }

  /*
  |--------------------------------------------------------------------------
  | SMTP TIDAK MENERIMA PENERIMA
  |--------------------------------------------------------------------------
  */
  if (!recipientAccepted) {
    throw new Error(
      `Server SMTP tidak menerima email tujuan: ${normalizedRecipient}`
    )
  }

  return {
    accepted,
    rejected,
    response:
      result.response || null,

    message_id:
      result.messageId || null
  }
}

/*
|--------------------------------------------------------------------------
| SEND VERIFICATION EMAIL
|--------------------------------------------------------------------------
| Mengirim email aktivasi akun.
|--------------------------------------------------------------------------
*/
const sendVerificationEmail = async ({
  email,
  nama_lengkap,
  token
}) => {
  const recipient =
    normalizeEmail(email)

  const name =
    String(
      nama_lengkap ||
        "Pengguna SIOPOS"
    ).trim()

  const rawToken =
    String(token || "").trim()

  /*
  |--------------------------------------------------------------------------
  | VALIDATE RECIPIENT
  |--------------------------------------------------------------------------
  */
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

  /*
  |--------------------------------------------------------------------------
  | VALIDATE TOKEN
  |--------------------------------------------------------------------------
  */
  if (!rawToken) {
    throw new Error(
      "Token aktivasi tidak ditemukan"
    )
  }

  try {
    /*
    |--------------------------------------------------------------------------
    | PUBLIC API URL
    |--------------------------------------------------------------------------
    */
    const appUrl =
      getPublicApiUrl()

    /*
    |--------------------------------------------------------------------------
    | VERIFICATION URL
    |--------------------------------------------------------------------------
    */
    const verificationUrl =
      `${appUrl}/auth/verify-email` +
      `?token=${encodeURIComponent(
        rawToken
      )}`

    console.log("")
    console.log(
      "=============================================="
    )
    console.log(
      "📧 PERSIAPAN EMAIL AKTIVASI"
    )
    console.log(
      "=============================================="
    )

    console.log(
      `Penerima : ${recipient}`
    )

    console.log(
      `Nama     : ${name}`
    )

    console.log(
      `URL      : ${verificationUrl}`
    )

    console.log(
      "=============================================="
    )
    console.log("")

    /*
    |--------------------------------------------------------------------------
    | GET TEMPLATE
    |--------------------------------------------------------------------------
    */
    const template =
      getVerificationEmailTemplate({
        nama_lengkap: name,
        verificationUrl
      })

    /*
    |--------------------------------------------------------------------------
    | VALIDATE TEMPLATE
    |--------------------------------------------------------------------------
    */
    if (
      !template ||
      !template.subject ||
      !template.html
    ) {
      throw new Error(
        "Template email aktivasi tidak valid"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | GET SENDER
    |--------------------------------------------------------------------------
    */
    const sender =
      getSender()

    /*
    |--------------------------------------------------------------------------
    | SEND EMAIL
    |--------------------------------------------------------------------------
    */
    const result =
      await transporter.sendMail({
        from: sender,

        to: recipient,

        replyTo:
          process.env
            .MAIL_FROM_ADDRESS ||
          process.env.MAIL_USER,

        subject:
          template.subject,

        text:
          template.text ||
          (
            `Halo ${name},\n\n` +
            `Akun SIOPOS Anda berhasil dibuat.\n\n` +
            `Aktifkan akun melalui tautan berikut:\n` +
            `${verificationUrl}`
          ),

        html:
          template.html
      })

    /*
    |--------------------------------------------------------------------------
    | VALIDATE SMTP RESULT
    |--------------------------------------------------------------------------
    */
    const mailResult =
      validateMailResult({
        result,
        recipient,
        mailType:
          "EMAIL AKTIVASI"
      })

    return {
      success: true,

      email: recipient,

      message_id:
        mailResult.message_id,

      accepted:
        mailResult.accepted,

      rejected:
        mailResult.rejected,

      response:
        mailResult.response
    }
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | ERROR LOG
    |--------------------------------------------------------------------------
    */
    console.error("")
    console.error(
      "=============================================="
    )

    console.error(
      "❌ GAGAL MENGIRIM EMAIL AKTIVASI"
    )

    console.error(
      "=============================================="
    )

    console.error(
      `Penerima : ${recipient}`
    )

    console.error(
      `Error    : ${
        error.message || error
      }`
    )

    if (error.code) {
      console.error(
        `Code     : ${error.code}`
      )
    }

    if (error.response) {
      console.error(
        `Response : ${error.response}`
      )
    }

    console.error(
      "=============================================="
    )
    console.error("")

    throw error
  }
}

/*
|--------------------------------------------------------------------------
| SEND RESET PASSWORD OTP
|--------------------------------------------------------------------------
| Mengirim kode OTP 6 digit.
|--------------------------------------------------------------------------
*/
const sendResetPasswordEmail = async ({
  email,
  nama_lengkap,
  otp
}) => {
  const recipient =
    normalizeEmail(email)

  const name =
    String(
      nama_lengkap ||
        "Pengguna SIOPOS"
    ).trim()

  const otpValue =
    String(otp || "").trim()

  /*
  |--------------------------------------------------------------------------
  | VALIDATE RECIPIENT
  |--------------------------------------------------------------------------
  */
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

  /*
  |--------------------------------------------------------------------------
  | VALIDATE OTP
  |--------------------------------------------------------------------------
  */
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

  try {
    /*
    |--------------------------------------------------------------------------
    | GET TEMPLATE
    |--------------------------------------------------------------------------
    */
    const template =
      getResetPasswordEmailTemplate({
        nama_lengkap: name,
        otp: otpValue
      })

    /*
    |--------------------------------------------------------------------------
    | VALIDATE TEMPLATE
    |--------------------------------------------------------------------------
    */
    if (
      !template ||
      !template.subject ||
      !template.html
    ) {
      throw new Error(
        "Template email OTP reset password tidak valid"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | GET SENDER
    |--------------------------------------------------------------------------
    */
    const sender =
      getSender()

    /*
    |--------------------------------------------------------------------------
    | SEND EMAIL
    |--------------------------------------------------------------------------
    */
    const result =
      await transporter.sendMail({
        from: sender,

        to: recipient,

        replyTo:
          process.env
            .MAIL_FROM_ADDRESS ||
          process.env.MAIL_USER,

        subject:
          template.subject,

        text:
          template.text ||
          (
            `Halo ${name},\n\n` +
            `Kode OTP reset password SIOPOS Anda adalah:\n\n` +
            `${otpValue}\n\n` +
            `Kode berlaku selama 10 menit.\n` +
            `Jangan berikan kode OTP kepada siapa pun.`
          ),

        html:
          template.html
      })

    /*
    |--------------------------------------------------------------------------
    | VALIDATE SMTP RESULT
    |--------------------------------------------------------------------------
    */
    const mailResult =
      validateMailResult({
        result,
        recipient,
        mailType:
          "OTP RESET PASSWORD"
      })

    return {
      success: true,

      email: recipient,

      message_id:
        mailResult.message_id,

      accepted:
        mailResult.accepted,

      rejected:
        mailResult.rejected,

      response:
        mailResult.response
    }
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | ERROR LOG
    |--------------------------------------------------------------------------
    */
    console.error("")
    console.error(
      "=============================================="
    )

    console.error(
      "❌ GAGAL MENGIRIM OTP RESET PASSWORD"
    )

    console.error(
      "=============================================="
    )

    console.error(
      `Penerima : ${recipient}`
    )

    console.error(
      `Error    : ${
        error.message || error
      }`
    )

    if (error.code) {
      console.error(
        `Code     : ${error.code}`
      )
    }

    if (error.response) {
      console.error(
        `Response : ${error.response}`
      )
    }

    console.error(
      "=============================================="
    )
    console.error("")

    throw error
  }
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/
module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail
}