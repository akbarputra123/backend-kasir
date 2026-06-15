
const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME OR EMAIL
|--------------------------------------------------------------------------
| Digunakan untuk login menggunakan username atau email.
|
| Relasi users.id_store hanya digunakan oleh admin dan kasir.
| Owner mengambil daftar toko melalui stores.id_owner.
|--------------------------------------------------------------------------
*/
const findUserByUsernameOrEmail = async (usernameOrEmail) => {
  const value = String(usernameOrEmail || "").trim()

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
      s.status_toko

    FROM users u

    LEFT JOIN stores s
      ON s.id_store = u.id_store

    WHERE u.username = ?
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
*/
const findUserByEmail = async (email) => {
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
      s.status_toko

    FROM users u

    LEFT JOIN stores s
      ON s.id_store = u.id_store

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
| Untuk owner:
| - id_store bernilai NULL
| - total_toko dihitung dari stores.id_owner
|
| Untuk admin/kasir:
| - id_store mengarah ke toko tempat mereka bekerja
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
| Setiap owner boleh mendaftar.
|
| Owner tidak menggunakan users.id_store karena satu owner dapat memiliki
| beberapa toko. Relasi owner dan toko disimpan di stores.id_owner.
|--------------------------------------------------------------------------
*/
const createOwner = async (data) => {
  const [result] = await pool.query(
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

  return {
    id_user: result.insertId,
    id_store: null,
    nama_lengkap: data.nama_lengkap,
    username: data.username,
    email: data.email,
    email_verified_at: null,
    verification_email_sent_at: null,
    no_hp: data.no_hp || null,
    role: "owner",
    status_akun: "nonaktif"
  }
}

/*
|--------------------------------------------------------------------------
| CREATE AUTH TOKEN
|--------------------------------------------------------------------------
| Menonaktifkan token lama dengan tipe yang sama, kemudian membuat token baru.
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

    await connection.commit()

    return {
      id_token: result.insertId,
      id_user: Number(id_user),
      tipe_token,
      expires_at
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| FIND VALID AUTH TOKEN
|--------------------------------------------------------------------------
*/
const findValidAuthToken = async (
  token_hash,
  tipe_token
) => {
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

    LIMIT 1
    `,
    [token_hash, tipe_token]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| UPDATE VERIFICATION EMAIL SENT AT
|--------------------------------------------------------------------------
*/
const updateVerificationEmailSentAt = async (id_user) => {
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
| Mengaktifkan akun dan menggunakan token dalam satu transaksi.
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
      throw new Error("Gagal mengaktifkan akun")
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
| RESET PASSWORD AND USE TOKEN
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
        "Token reset password tidak valid, sudah digunakan, atau sudah kedaluwarsa"
      )
    }

    const [passwordResult] = await connection.query(
      `
      UPDATE users
      SET
        password = ?,
        updated_at = NOW()
      WHERE id_user = ?
      `,
      [hashed_password, id_user]
    )

    if (passwordResult.affectedRows === 0) {
      throw new Error("Gagal memperbarui password")
    }

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
| Hanya untuk statistik, bukan untuk membatasi registrasi owner.
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
*/
const deleteExpiredAuthTokens = async () => {
  const [result] = await pool.query(
    `
    DELETE FROM auth_tokens
    WHERE expires_at < NOW()
       OR (
         used_at IS NOT NULL
         AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
       )
    `
  )

  return result.affectedRows
}

module.exports = {
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserByEmail,
  findUserById,

  createOwner,

  createAuthToken,
  findValidAuthToken,

  updateVerificationEmailSentAt,
  verifyEmailWithToken,
  resetPasswordWithToken,

  updateLastLogin,
  countOwner,
  deleteExpiredAuthTokens
}
