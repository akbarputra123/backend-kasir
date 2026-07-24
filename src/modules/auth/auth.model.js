
const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME OR EMAIL
|--------------------------------------------------------------------------
| Digunakan untuk login menggunakan username atau email.
|
| Owner:
| - users.id_store bernilai NULL
| - toko owner diambil melalui stores.id_owner
|
| Admin dan kasir:
| - users.id_store mengarah ke toko tempat mereka bekerja
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME OR EMAIL
|--------------------------------------------------------------------------
| Digunakan untuk login menggunakan username atau email.
|--------------------------------------------------------------------------
*/
const findUserByUsernameOrEmail = async (
  usernameOrEmail
) => {
  const value = String(
    usernameOrEmail || ""
  ).trim()

  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,

      u.nama_lengkap,
      u.username,
      u.email,

      u.email_verified_at,
      u.verification_email_sent_at,

      u.no_hp,
      u.password,

      u.role,
      u.status_akun,

      u.foto,

      u.last_login,
      u.created_at,
      u.updated_at,

      s.nama_toko,
      s.alamat AS alamat_toko,
      s.no_hp AS no_hp_toko,
      s.email AS email_toko,
      s.logo AS logo_toko,
      s.status_toko,

      bc.id_business_category,
      bc.nama_kategori AS kategori_usaha

    FROM users u

    LEFT JOIN stores s
      ON s.id_store = u.id_store

    LEFT JOIN business_categories bc
      ON bc.id_business_category =
         s.id_business_category

    WHERE
      u.username = ?
      OR u.email = ?

    LIMIT 1
    `,
    [value, value]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME
|--------------------------------------------------------------------------
| Digunakan untuk memeriksa username saat registrasi.
|--------------------------------------------------------------------------
*/
const findUserByUsername = async (username) => {
  const value = String(username || "").trim()

  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      u.nama_lengkap,
      u.username,
      u.email,
      u.email_verified_at,
      u.verification_email_sent_at,
      u.no_hp,
      u.password,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at

    FROM users u

    WHERE u.username = ?

    LIMIT 1
    `,
    [value]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY EMAIL
|--------------------------------------------------------------------------
| Digunakan untuk:
| - Validasi registrasi
| - Kirim ulang aktivasi
| - Lupa password
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| FIND USER BY EMAIL
|--------------------------------------------------------------------------
| Digunakan untuk:
| - Validasi registrasi
| - Kirim ulang aktivasi
| - Lupa password
|--------------------------------------------------------------------------
*/
const findUserByEmail = async (
  email
) => {
  const value = String(email || "")
    .trim()
    .toLowerCase()

  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,

      u.nama_lengkap,
      u.username,
      u.email,

      u.email_verified_at,
      u.verification_email_sent_at,

      u.no_hp,
      u.password,

      u.role,
      u.status_akun,

      u.foto,

      u.last_login,
      u.created_at,
      u.updated_at,

      s.nama_toko,
      s.alamat AS alamat_toko,
      s.no_hp AS no_hp_toko,
      s.email AS email_toko,
      s.logo AS logo_toko,
      s.status_toko,

      bc.id_business_category,
      bc.nama_kategori AS kategori_usaha

    FROM users u

    LEFT JOIN stores s
      ON s.id_store = u.id_store

    LEFT JOIN business_categories bc
      ON bc.id_business_category =
         s.id_business_category

    WHERE u.email = ?

    LIMIT 1
    `,
    [value]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY ID
|--------------------------------------------------------------------------
| Mengambil profil user berdasarkan ID pada JWT.
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| FIND USER BY ID
|--------------------------------------------------------------------------
| Mengambil profil user berdasarkan ID dari JWT.
|--------------------------------------------------------------------------
*/
const findUserById = async (id_user) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,

      u.nama_lengkap,
      u.username,
      u.email,

      u.email_verified_at,
      u.verification_email_sent_at,

      u.no_hp,
      u.password,

      u.role,
      u.status_akun,

      u.foto,

      u.last_login,
      u.created_at,
      u.updated_at,

      s.nama_toko,
      s.alamat AS alamat_toko,
      s.no_hp AS no_hp_toko,
      s.email AS email_toko,
      s.logo AS logo_toko,
      s.status_toko,

      bc.id_business_category,
      bc.nama_kategori AS kategori_usaha,

      CASE
        WHEN u.role = 'owner' THEN (
          SELECT COUNT(*)
          FROM stores owner_store
          WHERE owner_store.id_owner = u.id_user
        )
        ELSE 0
      END AS total_toko

    FROM users u

    LEFT JOIN stores s
      ON s.id_store = u.id_store

    LEFT JOIN business_categories bc
      ON bc.id_business_category = s.id_business_category

    WHERE u.id_user = ?

    LIMIT 1
    `,
    [id_user]
  )

  return rows[0] || null
}
/*
|--------------------------------------------------------------------------
| CREATE OWNER
|--------------------------------------------------------------------------
| Membuat owner baru dengan status nonaktif.
|
| Owner tidak menggunakan users.id_store karena satu owner dapat memiliki
| beberapa toko melalui stores.id_owner.
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| REGISTER OWNER
|--------------------------------------------------------------------------
| Membuat akun owner beserta toko pertamanya dalam satu transaksi.
|
| Flow:
| 1. Insert users
| 2. Insert stores
| 3. Update users.id_store
|--------------------------------------------------------------------------
*/
const registerOwner = async (data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    /*
    |--------------------------------------------------------------------------
    | CREATE OWNER
    |--------------------------------------------------------------------------
    */
    const [userResult] = await connection.query(
      `
      INSERT INTO users
      (
        id_store,
        nama_lengkap,
        username,
        email,
        email_verified_at,
        verification_email_sent_at,
        no_hp,
        password,
        role,
        status_akun
      )
      VALUES
      (
        NULL,
        ?,
        ?,
        ?,
        NULL,
        NULL,
        ?,
        ?,
        'owner',
        'nonaktif'
      )
      `,
      [
        data.nama_lengkap,
        data.username,
        data.email,
        data.no_hp || null,
        data.password
      ]
    )

    const id_user = userResult.insertId

    console.log("================================")
    console.log("USER BERHASIL DIBUAT")
    console.log("ID USER :", id_user)
    console.log("EMAIL   :", data.email)
    console.log("================================")

    /*
    |--------------------------------------------------------------------------
    | CREATE STORE
    |--------------------------------------------------------------------------
    */
    const [storeResult] = await connection.query(
      `
      INSERT INTO stores
      (
        id_owner,
        id_business_category,
        nama_toko,
        logo
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?
      )
      `,
      [
        id_user,
        data.id_business_category,
        data.nama_toko,
        data.logo || null
      ]
    )

    const id_store = storeResult.insertId

    console.log("STORE BERHASIL DIBUAT")
    console.log("ID STORE :", id_store)

    /*
    |--------------------------------------------------------------------------
    | UPDATE DEFAULT STORE OWNER
    |--------------------------------------------------------------------------
    */
    await connection.query(
      `
      UPDATE users
      SET
        id_store = ?,
        updated_at = NOW()
      WHERE id_user = ?
      `,
      [
        id_store,
        id_user
      ]
    )

    console.log("DEFAULT STORE OWNER DIPERBARUI")

    await connection.commit()

    console.log("TRANSAKSI REGISTER BERHASIL")
    console.log("================================")

    return {
      id_user,
      id_store,

      nama_lengkap: data.nama_lengkap,
      username: data.username,
      email: data.email,
      no_hp: data.no_hp || null,

      nama_toko: data.nama_toko,
      id_business_category: data.id_business_category,
      logo: data.logo || null,

      role: "owner",
      status_akun: "nonaktif",

      email_verified_at: null,
      verification_email_sent_at: null
    }
  } catch (error) {
    await connection.rollback()
    console.error("REGISTER OWNER MODEL ERROR:", error)
    throw error
  } finally {
    connection.release()
  }
}
/*
|--------------------------------------------------------------------------
| CREATE AUTH TOKEN
|--------------------------------------------------------------------------
| Digunakan untuk:
| - verifikasi_email
| - reset_password
|
| Token lama dengan tipe yang sama akan dinonaktifkan sebelum token baru
| dibuat.
|--------------------------------------------------------------------------
*/
const createAuthToken = async ({
  id_user,
  token_hash,
  tipe_token,
  expires_at
}) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    console.log("")
    console.log("========== CREATE AUTH TOKEN ==========")
    console.log("ID USER    :", id_user)
    console.log("TOKEN HASH :", token_hash)
    console.log("TIPE TOKEN :", tipe_token)
    console.log("EXPIRES    :", expires_at)
    console.log("=======================================")

    await connection.query(
      `
      UPDATE auth_tokens
      SET used_at = NOW()
      WHERE id_user = ?
        AND tipe_token = ?
        AND used_at IS NULL
      `,
      [id_user, tipe_token]
    )

    const [result] = await connection.query(
      `
      INSERT INTO auth_tokens
      (
        id_user,
        token_hash,
        tipe_token,
        expires_at,
        used_at
      )
      VALUES (?, ?, ?, ?, NULL)
      `,
      [
        id_user,
        token_hash,
        tipe_token,
        expires_at
      ]
    )

    const [check] = await connection.query(
      `
      SELECT
        id_token,
        id_user,
        token_hash,
        tipe_token,
        expires_at,
        used_at
      FROM auth_tokens
      WHERE id_token = ?
      LIMIT 1
      `,
      [result.insertId]
    )

    console.log("")
    console.log("========== HASIL INSERT DATABASE ==========")
    console.log(check[0])
    console.log("===========================================")

    await connection.commit()

    return {
      id_token: result.insertId,
      id_user: Number(id_user),
      tipe_token,
      expires_at
    }
  } catch (error) {
    await connection.rollback()
    console.error("CREATE AUTH TOKEN ERROR:", error)
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| FIND VALID AUTH TOKEN
|--------------------------------------------------------------------------
| Digunakan untuk token aktivasi akun.
|--------------------------------------------------------------------------
*/
const findValidAuthToken = async (
  token_hash,
  tipe_token
) => {
  console.log("")
  console.log("========== FIND VALID AUTH TOKEN ==========")
  console.log("TOKEN HASH :", token_hash)
  console.log("TIPE TOKEN :", tipe_token)

  // Cek database yang sedang digunakan
  const [db] = await pool.query(`
    SELECT
      DATABASE() AS database_name,
      NOW() AS server_time
  `)

  console.log("DATABASE :", db[0].database_name)
  console.log("SERVER TIME :", db[0].server_time)

  // Cek apakah token benar-benar ada
  const [checkToken] = await pool.query(
    `
    SELECT
      id_token,
      id_user,
      token_hash,
      tipe_token,
      expires_at,
      used_at
    FROM auth_tokens
    WHERE token_hash = ?
    `,
    [token_hash]
  )

  console.log("")
  console.log("========== CEK TOKEN LANGSUNG ==========")
  console.log("JUMLAH :", checkToken.length)

  if (checkToken.length > 0) {
    console.log(checkToken[0])
  } else {
    console.log("TOKEN TIDAK ADA DI DATABASE")
  }

  const [rows] = await pool.query(
    `
    SELECT
      at.id_token,
      at.id_user,
      at.token_hash,
      at.tipe_token,
      at.expires_at,
      at.used_at,
      at.created_at,

      u.nama_lengkap,
      u.username,
      u.email,
      u.email_verified_at,
      u.status_akun

    FROM auth_tokens at

    INNER JOIN users u
      ON u.id_user = at.id_user

    WHERE at.token_hash = ?
      AND at.tipe_token = ?
      AND at.used_at IS NULL
      AND at.expires_at > NOW()

    ORDER BY at.id_token DESC
    LIMIT 1
    `,
    [token_hash, tipe_token]
  )

  console.log("")
  console.log("========== HASIL QUERY ==========")
  console.log("JUMLAH DATA :", rows.length)

  if (rows.length > 0) {
    console.log(rows[0])
  } else {
    console.log("DATA TIDAK DITEMUKAN")
  }

  console.log("=================================")
  console.log("")

  return rows[0] || null
}

const findValidResetOtp = async ({
  email,
  otp_hash
}) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase()

  const [rows] = await pool.query(
    `
    SELECT
      at.id_token,
      at.id_user,
      at.token_hash,
      at.tipe_token,
      at.expires_at,
      at.used_at,
      at.created_at,

      u.nama_lengkap,
      u.username,
      u.email,
      u.password,
      u.role,
      u.status_akun

    FROM auth_tokens at

    INNER JOIN users u
      ON u.id_user = at.id_user

    WHERE u.email = ?
      AND at.token_hash = ?
      AND at.tipe_token = 'reset_password'
      AND at.used_at IS NULL
      AND at.expires_at > NOW()

    ORDER BY at.id_token DESC
    LIMIT 1
    `,
    [
      normalizedEmail,
      otp_hash
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| UPDATE VERIFICATION EMAIL SENT AT
|--------------------------------------------------------------------------
| Menyimpan waktu terakhir email aktivasi dikirim.
|--------------------------------------------------------------------------
*/
const updateVerificationEmailSentAt = async (
  id_user
) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET
      verification_email_sent_at = NOW(),
      updated_at = NOW()
    WHERE id_user = ?
    `,
    [id_user]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL AND USE TOKEN
|--------------------------------------------------------------------------
| Mengaktifkan akun dan menandai token verifikasi sebagai sudah digunakan
| dalam satu transaksi.
|--------------------------------------------------------------------------
*/
const verifyEmailWithToken = async ({
  id_user,
  id_token
}) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [tokenRows] = await connection.query(
      `
      SELECT
        id_token,
        id_user,
        tipe_token,
        used_at,
        expires_at

      FROM auth_tokens

      WHERE id_token = ?
        AND id_user = ?
        AND tipe_token = 'verifikasi_email'
        AND used_at IS NULL
        AND expires_at > NOW()

      LIMIT 1
      FOR UPDATE
      `,
      [id_token, id_user]
    )

    if (!tokenRows[0]) {
      throw new Error(
        "Token aktivasi tidak valid, sudah digunakan, atau sudah kedaluwarsa"
      )
    }

    const [userResult] = await connection.query(
      `
      UPDATE users
      SET
        email_verified_at = COALESCE(
          email_verified_at,
          NOW()
        ),
        status_akun = 'aktif',
        updated_at = NOW()
      WHERE id_user = ?
      `,
      [id_user]
    )

    if (userResult.affectedRows === 0) {
      throw new Error(
        "Gagal mengaktifkan akun"
      )
    }

    await connection.query(
      `
      UPDATE auth_tokens
      SET used_at = NOW()
      WHERE id_user = ?
        AND tipe_token = 'verifikasi_email'
        AND used_at IS NULL
      `,
      [id_user]
    )

    await connection.commit()

    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD WITH OTP
|--------------------------------------------------------------------------
| Mengubah password dan menandai OTP sudah digunakan dalam satu transaksi.
|--------------------------------------------------------------------------
*/
const resetPasswordWithToken = async ({
  id_user,
  id_token,
  hashed_password
}) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [tokenRows] = await connection.query(
      `
      SELECT
        id_token,
        id_user,
        tipe_token,
        used_at,
        expires_at

      FROM auth_tokens

      WHERE id_token = ?
        AND id_user = ?
        AND tipe_token = 'reset_password'
        AND used_at IS NULL
        AND expires_at > NOW()

      LIMIT 1
      FOR UPDATE
      `,
      [id_token, id_user]
    )

    if (!tokenRows[0]) {
      throw new Error(
        "Kode OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa"
      )
    }

    const [passwordResult] =
      await connection.query(
        `
        UPDATE users
        SET
          password = ?,
          updated_at = NOW()
        WHERE id_user = ?
        `,
        [
          hashed_password,
          id_user
        ]
      )

    if (passwordResult.affectedRows === 0) {
      throw new Error(
        "Gagal memperbarui password"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | NONAKTIFKAN SEMUA OTP RESET PASSWORD USER
    |--------------------------------------------------------------------------
    */
    await connection.query(
      `
      UPDATE auth_tokens
      SET used_at = NOW()
      WHERE id_user = ?
        AND tipe_token = 'reset_password'
        AND used_at IS NULL
      `,
      [id_user]
    )

    await connection.commit()

    return true
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE LAST LOGIN
|--------------------------------------------------------------------------
*/
const updateLastLogin = async (id_user) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET
      last_login = NOW(),
      updated_at = NOW()
    WHERE id_user = ?
    `,
    [id_user]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| COUNT OWNER
|--------------------------------------------------------------------------
| Hanya digunakan untuk statistik.
| Tidak digunakan untuk membatasi registrasi owner.
|--------------------------------------------------------------------------
*/
const countOwner = async () => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM users
    WHERE role = 'owner'
    `
  )

  return Number(rows[0]?.total || 0)
}

/*
|--------------------------------------------------------------------------
| DELETE EXPIRED AUTH TOKENS
|--------------------------------------------------------------------------
| Menghapus token kedaluwarsa dan token yang sudah lama digunakan.
|--------------------------------------------------------------------------
*/
const deleteExpiredAuthTokens = async () => {
  const [result] = await pool.query(
    `
    DELETE FROM auth_tokens
    WHERE expires_at < NOW()
       OR (
         used_at IS NOT NULL
         AND used_at < DATE_SUB(
           NOW(),
           INTERVAL 7 DAY
         )
       )
    `
  )

  return result.affectedRows
}

/*
|--------------------------------------------------------------------------
| GET BUSINESS CATEGORIES
|--------------------------------------------------------------------------
| Mengambil seluruh kategori usaha yang aktif.
| Digunakan pada halaman registrasi owner.
|--------------------------------------------------------------------------
*/
const getBusinessCategories = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      bc.id_business_category,
      bc.nama_kategori
    FROM business_categories bc
    WHERE bc.status = 'aktif'
    ORDER BY bc.nama_kategori ASC
    `
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND BUSINESS CATEGORY BY ID
|--------------------------------------------------------------------------
| Digunakan untuk memvalidasi kategori usaha saat registrasi owner.
|--------------------------------------------------------------------------
*/
const findBusinessCategoryById = async (
  id_business_category
) => {
  const [rows] = await pool.query(
    `
    SELECT
      bc.id_business_category,
      bc.nama_kategori,
      bc.status,
      bc.created_at,
      bc.updated_at
    FROM business_categories bc
    WHERE bc.id_business_category = ?
      AND bc.status = 'aktif'
    LIMIT 1
    `,
    [id_business_category]
  )

  return rows[0] || null
}
module.exports = {
  // USER
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserByEmail,
  findUserById,

  // BUSINESS CATEGORY
  getBusinessCategories,
  findBusinessCategoryById,

  // REGISTER
  registerOwner,

  // AUTH TOKEN
  createAuthToken,
  findValidAuthToken,
  findValidResetOtp,

  // EMAIL VERIFICATION
  updateVerificationEmailSentAt,
  verifyEmailWithToken,

  // RESET PASSWORD
  resetPasswordWithToken,

  // LOGIN
  updateLastLogin,

  // STATISTIC
  countOwner,

  // CLEANUP
  deleteExpiredAuthTokens
}