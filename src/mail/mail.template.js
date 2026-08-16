/*
|--------------------------------------------------------------------------
| SIOPOS - EMAIL TEMPLATES
|--------------------------------------------------------------------------
| Template email transactional SIOPOS.
|
| Digunakan untuk:
| - Aktivasi akun
| - Reset password dengan OTP
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| BRAND
|--------------------------------------------------------------------------
*/
const BRAND = {
  name: "SIOPOS",
  tagline: "Aplikasi Kasir dan Manajemen Toko",

  colors: {
    primary: "#7C2D12",
    primaryDark: "#5C1F0D",
    primarySoft: "#FFF7ED",

    text: "#1F2937",
    textSecondary: "#4B5563",
    muted: "#6B7280",

    background: "#F5F6F8",
    card: "#FFFFFF",

    border: "#E5E7EB",

    success: "#15803D",
    successSoft: "#F0FDF4",
    successBorder: "#BBF7D0",

    warning: "#B45309",
    warningSoft: "#FFFBEB",
    warningBorder: "#FDE68A",

    danger: "#B91C1C",
    dangerSoft: "#FEF2F2",
    dangerBorder: "#FECACA"
  }
}

/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
| Mencegah nama pengguna merusak struktur HTML.
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
| NORMALIZE TEXT
|--------------------------------------------------------------------------
*/
const normalizeText = (
  value,
  fallback = ""
) => {
  const text = String(value || "").trim()

  return text || fallback
}

/*
|--------------------------------------------------------------------------
| EMAIL HEADER
|--------------------------------------------------------------------------
*/
const getEmailHeader = () => {
  return `
    <div style="
      margin:0 0 28px 0;
      padding:0 0 24px 0;
      border-bottom:1px solid ${BRAND.colors.border};
      text-align:center;
    ">

      <div style="
        margin:0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:30px;
        line-height:38px;
        font-weight:700;
        letter-spacing:-0.7px;
        color:${BRAND.colors.primary};
      ">
        ${BRAND.name}
      </div>

      <div style="
        margin:7px 0 0 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        line-height:20px;
        color:${BRAND.colors.muted};
      ">
        ${BRAND.tagline}
      </div>

    </div>
  `
}

/*
|--------------------------------------------------------------------------
| EMAIL FOOTER
|--------------------------------------------------------------------------
*/
const getEmailFooter = () => {
  return `
    <div style="
      margin:30px 0 0 0;
      padding:20px 0 0 0;
      border-top:1px solid ${BRAND.colors.border};
      text-align:center;
    ">

      <p style="
        margin:0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        line-height:18px;
        color:${BRAND.colors.muted};
      ">
        Email ini dikirim secara otomatis oleh ${BRAND.name}.
      </p>

      <p style="
        margin:6px 0 0 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:12px;
        line-height:18px;
        color:${BRAND.colors.muted};
      ">
        Mohon tidak membalas email ini.
      </p>

      <p style="
        margin:10px 0 0 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:11px;
        line-height:17px;
        color:#9CA3AF;
      ">
        &copy; ${new Date().getFullYear()} ${BRAND.name}
      </p>

    </div>
  `
}

/*
|--------------------------------------------------------------------------
| EMAIL WRAPPER
|--------------------------------------------------------------------------
*/
const getEmailWrapper = (content) => {
  return `
    <!DOCTYPE html>
    <html lang="id">

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <meta
          name="color-scheme"
          content="light"
        >

        <meta
          name="supported-color-schemes"
          content="light"
        >

        <title>${BRAND.name}</title>

      </head>

      <body style="
        margin:0;
        padding:0;
        width:100%;
        background:${BRAND.colors.background};
        -webkit-text-size-adjust:100%;
        -ms-text-size-adjust:100%;
      ">

        <div style="
          width:100%;
          margin:0;
          padding:32px 16px;
          box-sizing:border-box;
          background:${BRAND.colors.background};
        ">

          <div style="
            width:100%;
            max-width:580px;
            margin:0 auto;
          ">

            <div style="
              width:100%;
              box-sizing:border-box;
              padding:32px 28px;
              background:${BRAND.colors.card};
              border:1px solid ${BRAND.colors.border};
              border-radius:16px;
            ">

              ${getEmailHeader()}

              ${content}

              ${getEmailFooter()}

            </div>

          </div>

        </div>

      </body>

    </html>
  `
}

/*
|--------------------------------------------------------------------------
| PRIMARY BUTTON
|--------------------------------------------------------------------------
*/
const getPrimaryButton = ({
  href,
  text
}) => {
  const safeHref = normalizeText(
    href,
    "#"
  )

  const safeText = normalizeText(
    text,
    "Lanjutkan"
  )

  return `
    <div style="
      margin:30px 0;
      padding:0;
      text-align:center;
    ">

      <a
        href="${safeHref}"
        target="_blank"
        rel="noopener noreferrer"
        style="
          display:inline-block;
          margin:0;
          padding:14px 28px;
          border-radius:8px;
          background:${BRAND.colors.primary};
          color:#FFFFFF;
          font-family:Arial,Helvetica,sans-serif;
          font-size:14px;
          line-height:20px;
          font-weight:700;
          text-decoration:none;
        "
      >
        ${safeText}
      </a>

    </div>
  `
}

/*
|--------------------------------------------------------------------------
| INFO BOX
|--------------------------------------------------------------------------
*/
const getInfoBox = ({
  type = "info",
  title,
  message
}) => {
  let background = "#F9FAFB"
  let border = BRAND.colors.border
  let titleColor = BRAND.colors.text
  let messageColor = BRAND.colors.textSecondary

  if (type === "success") {
    background = BRAND.colors.successSoft
    border = BRAND.colors.successBorder
    titleColor = BRAND.colors.success
    messageColor = "#166534"
  }

  if (type === "warning") {
    background = BRAND.colors.warningSoft
    border = BRAND.colors.warningBorder
    titleColor = BRAND.colors.warning
    messageColor = "#92400E"
  }

  if (type === "danger") {
    background = BRAND.colors.dangerSoft
    border = BRAND.colors.dangerBorder
    titleColor = BRAND.colors.danger
    messageColor = "#991B1B"
  }

  return `
    <div style="
      margin:22px 0 0 0;
      padding:16px;
      background:${background};
      border:1px solid ${border};
      border-radius:10px;
    ">

      ${
        title
          ? `
            <p style="
              margin:0 0 5px 0;
              padding:0;
              font-family:Arial,Helvetica,sans-serif;
              font-size:13px;
              line-height:19px;
              font-weight:700;
              color:${titleColor};
            ">
              ${title}
            </p>
          `
          : ""
      }

      <p style="
        margin:0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        line-height:20px;
        color:${messageColor};
      ">
        ${message}
      </p>

    </div>
  `
}

/*
|--------------------------------------------------------------------------
| VERIFICATION EMAIL TEMPLATE
|--------------------------------------------------------------------------
| Email aktivasi akun.
|--------------------------------------------------------------------------
*/
const getVerificationEmailTemplate = ({
  nama_lengkap,
  verificationUrl
}) => {
  const name = normalizeText(
    nama_lengkap,
    "Pengguna SIOPOS"
  )

  const safeName = escapeHtml(name)

  const safeVerificationUrl = normalizeText(
    verificationUrl
  )

  return {
    subject: "Aktifkan Akun SIOPOS Anda",

    /*
    |--------------------------------------------------------------------------
    | PLAIN TEXT VERSION
    |--------------------------------------------------------------------------
    */
    text:
      `Halo ${name},\n\n` +

      `Selamat datang di SIOPOS.\n\n` +

      `Akun SIOPOS Anda berhasil dibuat.\n\n` +

      `Untuk mulai menggunakan akun Anda, silakan aktifkan akun melalui tautan berikut:\n\n` +

      `${safeVerificationUrl}\n\n` +

      `Tautan aktivasi berlaku selama 24 jam.\n\n` +

      `Jika Anda tidak pernah membuat akun SIOPOS, abaikan email ini.\n\n` +

      `Email ini dikirim secara otomatis oleh SIOPOS.`,

    /*
    |--------------------------------------------------------------------------
    | HTML VERSION
    |--------------------------------------------------------------------------
    */
    html: getEmailWrapper(`

      <h1 style="
        margin:0 0 16px 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:22px;
        line-height:30px;
        font-weight:700;
        color:${BRAND.colors.text};
      ">
        Aktivasi Akun
      </h1>

      <p style="
        margin:0 0 16px 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:24px;
        color:${BRAND.colors.text};
      ">
        Halo <strong>${safeName}</strong>,
      </p>

      <p style="
        margin:0 0 16px 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:24px;
        color:${BRAND.colors.textSecondary};
      ">
        Selamat datang di
        <strong style="
          color:${BRAND.colors.text};
        ">
          SIOPOS
        </strong>.
        Akun Anda berhasil dibuat.
      </p>

      <p style="
        margin:0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:24px;
        color:${BRAND.colors.textSecondary};
      ">
        Untuk mulai menggunakan akun Anda,
        silakan aktifkan akun melalui tombol berikut.
      </p>

      ${getPrimaryButton({
        href: safeVerificationUrl,
        text: "Aktifkan Akun"
      })}

      ${getInfoBox({
        type: "warning",
        title: "Masa berlaku tautan",
        message:
          "Tautan aktivasi ini berlaku selama <strong>24 jam</strong>. Setelah masa berlaku berakhir, Anda perlu melakukan proses aktivasi kembali."
      })}

      <p style="
        margin:24px 0 0 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        line-height:20px;
        color:${BRAND.colors.muted};
      ">
        Jika tombol di atas tidak dapat digunakan,
        salin tautan aktivasi dari versi teks email ini
        dan buka melalui browser.
      </p>

      <p style="
        margin:16px 0 0 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        line-height:20px;
        color:${BRAND.colors.muted};
      ">
        Jika Anda tidak pernah membuat akun SIOPOS,
        abaikan email ini. Tidak diperlukan tindakan lebih lanjut.
      </p>

    `)
  }
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD OTP TEMPLATE
|--------------------------------------------------------------------------
| Email kode OTP reset password.
|--------------------------------------------------------------------------
*/
const getResetPasswordEmailTemplate = ({
  nama_lengkap,
  otp
}) => {
  const name = normalizeText(
    nama_lengkap,
    "Pengguna SIOPOS"
  )

  const safeName = escapeHtml(name)

  const otpValue = normalizeText(
    otp
  )

  const safeOtp = escapeHtml(
    otpValue
  )

  return {
    subject: "Kode OTP Reset Password SIOPOS",

    /*
    |--------------------------------------------------------------------------
    | PLAIN TEXT VERSION
    |--------------------------------------------------------------------------
    */
    text:
      `Halo ${name},\n\n` +

      `Kami menerima permintaan untuk mengatur ulang password akun SIOPOS Anda.\n\n` +

      `Kode OTP Anda:\n\n` +

      `${otpValue}\n\n` +

      `Kode OTP berlaku selama 10 menit.\n\n` +

      `Jangan berikan kode OTP ini kepada siapa pun, termasuk pihak yang mengaku sebagai tim SIOPOS.\n\n` +

      `Jika Anda tidak meminta reset password, abaikan email ini.\n\n` +

      `Email ini dikirim secara otomatis oleh SIOPOS.`,

    /*
    |--------------------------------------------------------------------------
    | HTML VERSION
    |--------------------------------------------------------------------------
    */
    html: getEmailWrapper(`

      <h1 style="
        margin:0 0 16px 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:22px;
        line-height:30px;
        font-weight:700;
        color:${BRAND.colors.text};
      ">
        Reset Password
      </h1>

      <p style="
        margin:0 0 16px 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:24px;
        color:${BRAND.colors.text};
      ">
        Halo <strong>${safeName}</strong>,
      </p>

      <p style="
        margin:0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:15px;
        line-height:24px;
        color:${BRAND.colors.textSecondary};
      ">
        Kami menerima permintaan untuk mengatur ulang
        password akun SIOPOS Anda.
      </p>

      <p style="
        margin:24px 0 10px 0;
        padding:0;
        text-align:center;
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        line-height:20px;
        color:${BRAND.colors.muted};
      ">
        Gunakan kode OTP berikut:
      </p>

      <div style="
        margin:0;
        padding:22px 16px;
        background:${BRAND.colors.primarySoft};
        border:1px solid #FED7AA;
        border-radius:12px;
        text-align:center;
      ">

        <div style="
          margin:0;
          padding:0;
          font-family:Arial,Helvetica,sans-serif;
          font-size:32px;
          line-height:40px;
          font-weight:700;
          letter-spacing:8px;
          color:${BRAND.colors.primary};
        ">
          ${safeOtp}
        </div>

      </div>

      ${getInfoBox({
        type: "success",
        title: "Masa berlaku OTP",
        message:
          "Kode OTP ini berlaku selama <strong>10 menit</strong>. Setelah masa tersebut berakhir, kode tidak dapat digunakan lagi."
      })}

      ${getInfoBox({
        type: "danger",
        title: "Jaga keamanan akun",
        message:
          "Jangan pernah memberikan kode OTP kepada siapa pun. Tim SIOPOS tidak akan meminta kode OTP Anda."
      })}

      <p style="
        margin:22px 0 0 0;
        padding:0;
        font-family:Arial,Helvetica,sans-serif;
        font-size:13px;
        line-height:20px;
        color:${BRAND.colors.muted};
      ">
        Jika Anda tidak meminta reset password,
        abaikan email ini. Password akun Anda tidak akan berubah
        tanpa proses reset yang berhasil.
      </p>

    `)
  }
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/
module.exports = {
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate
}