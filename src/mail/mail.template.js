
const getVerificationEmailTemplate = ({
  nama_lengkap,
  verificationUrl
}) => {
  return {
    subject: "Aktivasi Akun SIOPOS",

    text:
      `Halo ${nama_lengkap},\n\n` +
      `Registrasi akun SIOPOS berhasil.\n` +
      `Aktifkan akun melalui tautan berikut:\n\n` +
      `${verificationUrl}\n\n` +
      `Tautan berlaku selama 24 jam.\n\n` +
      `Abaikan email ini jika Anda tidak melakukan registrasi.`,

    html: `
      <div
        style="
          max-width: 560px;
          margin: 0 auto;
          padding: 28px;
          font-family: Arial, sans-serif;
          color: #1f2937;
          background: #ffffff;
        "
      >
        <div
          style="
            text-align: center;
            margin-bottom: 24px;
          "
        >
          <h1
            style="
              margin: 0;
              color: #7c2d12;
              font-size: 28px;
            "
          >
            SIOPOS
          </h1>

          <p
            style="
              margin: 6px 0 0;
              color: #6b7280;
              font-size: 13px;
            "
          >
            Aplikasi Kasir dan Manajemen Toko
          </p>
        </div>

        <div
          style="
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 24px;
          "
        >
          <h2
            style="
              margin-top: 0;
              color: #1f2937;
              font-size: 21px;
            "
          >
            Aktivasi Akun
          </h2>

          <p>
            Halo <strong>${nama_lengkap}</strong>,
          </p>

          <p style="line-height: 1.6">
            Registrasi akun Anda berhasil. Silakan klik tombol
            di bawah untuk mengaktifkan akun SIOPOS.
          </p>

          <div
            style="
              text-align: center;
              margin: 30px 0;
            "
          >
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 13px 24px;
                border-radius: 9px;
                background: #7c2d12;
                color: #ffffff;
                text-decoration: none;
                font-weight: bold;
              "
            >
              Aktifkan Akun
            </a>
          </div>

          <p
            style="
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
            "
          >
            Tautan aktivasi berlaku selama 24 jam.
          </p>

          <p
            style="
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
            "
          >
            Abaikan email ini jika Anda tidak melakukan registrasi.
          </p>
        </div>
      </div>
    `
  }
}

const getResetPasswordEmailTemplate = ({
  nama_lengkap,
  resetUrl
}) => {
  return {
    subject: "Reset Password SIOPOS",

    text:
      `Halo ${nama_lengkap},\n\n` +
      `Kami menerima permintaan reset password akun SIOPOS.\n` +
      `Gunakan tautan berikut:\n\n` +
      `${resetUrl}\n\n` +
      `Tautan berlaku selama 30 menit.\n\n` +
      `Abaikan email ini jika Anda tidak meminta reset password.`,

    html: `
      <div
        style="
          max-width: 560px;
          margin: 0 auto;
          padding: 28px;
          font-family: Arial, sans-serif;
          color: #1f2937;
          background: #ffffff;
        "
      >
        <div
          style="
            text-align: center;
            margin-bottom: 24px;
          "
        >
          <h1
            style="
              margin: 0;
              color: #7c2d12;
              font-size: 28px;
            "
          >
            SIOPOS
          </h1>

          <p
            style="
              margin: 6px 0 0;
              color: #6b7280;
              font-size: 13px;
            "
          >
            Aplikasi Kasir dan Manajemen Toko
          </p>
        </div>

        <div
          style="
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 24px;
          "
        >
          <h2
            style="
              margin-top: 0;
              color: #1f2937;
              font-size: 21px;
            "
          >
            Reset Password
          </h2>

          <p>
            Halo <strong>${nama_lengkap}</strong>,
          </p>

          <p style="line-height: 1.6">
            Kami menerima permintaan untuk mengatur ulang password
            akun SIOPOS Anda.
          </p>

          <div
            style="
              text-align: center;
              margin: 30px 0;
            "
          >
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 13px 24px;
                border-radius: 9px;
                background: #7c2d12;
                color: #ffffff;
                text-decoration: none;
                font-weight: bold;
              "
            >
              Reset Password
            </a>
          </div>

          <p
            style="
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
            "
          >
            Tautan reset password berlaku selama 30 menit.
          </p>

          <p
            style="
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
            "
          >
            Abaikan email ini jika Anda tidak meminta reset password.
          </p>
        </div>
      </div>
    `
  }
}

module.exports = {
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate
}
