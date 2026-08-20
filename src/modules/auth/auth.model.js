const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME OR EMAIL (untuk login)
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
      s.status_toko,
      bc.id_business_category,
      bc.nama_kategori AS kategori_usaha
    FROM users u
    LEFT JOIN stores s ON s.id_store = u.id_store
    LEFT JOIN business_categories bc ON bc.id_business_category = s.id_business_category
    WHERE u.username = ? OR u.email = ?
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
  const value = String(email || "").trim().toLowerCase()
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
    LEFT JOIN stores s ON s.id_store = u.id_store
    LEFT JOIN business_categories bc ON bc.id_business_category = s.id_business_category
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
          SELECT COUNT(*) FROM stores owner_store WHERE owner_store.id_owner = u.id_user
        )
        ELSE 0
      END AS total_toko
    FROM users u
    LEFT JOIN stores s ON s.id_store = u.id_store
    LEFT JOIN business_categories bc ON bc.id_business_category = s.id_business_category
    WHERE u.id_user = ?
    LIMIT 1
    `,
    [id_user]
  )
  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| REGISTER OWNER (dengan transaksi)
|--------------------------------------------------------------------------
*/
const registerOwner = async (data) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [userResult] = await connection.query(
      `
      INSERT INTO users
      (id_store, nama_lengkap, username, email, email_verified_at, verification_email_sent_at, no_hp, password, role, status_akun)
      VALUES (NULL, ?, ?, ?, NULL, NULL, ?, ?, 'owner', 'nonaktif')
      `,
      [data.nama_lengkap, data.username, data.email, data.no_hp || null, data.password]
    )
    const id_user = userResult.insertId

    const [storeResult] = await connection.query(
      `
      INSERT INTO stores (id_owner, id_business_category, nama_toko, logo)
      VALUES (?, ?, ?, ?)
      `,
      [id_user, data.id_business_category, data.nama_toko, data.logo || null]
    )
    const id_store = storeResult.insertId

    await connection.query(
      `UPDATE users SET id_store = ?, updated_at = NOW() WHERE id_user = ?`,
      [id_store, id_user]
    )

    await connection.commit()
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
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| AUTH TOKEN
|--------------------------------------------------------------------------
*/
const createAuthToken = async ({ id_user, token_hash, tipe_token, expires_at }) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    // Nonaktifkan token lama sejenis
    await connection.query(
      `UPDATE auth_tokens SET used_at = NOW() WHERE id_user = ? AND tipe_token = ? AND used_at IS NULL`,
      [id_user, tipe_token]
    )
    const [result] = await connection.query(
      `INSERT INTO auth_tokens (id_user, token_hash, tipe_token, expires_at, used_at) VALUES (?, ?, ?, ?, NULL)`,
      [id_user, token_hash, tipe_token, expires_at]
    )
    await connection.commit()
    return { id_token: result.insertId, id_user, tipe_token, expires_at }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

const findValidAuthToken = async (token_hash, tipe_token) => {
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
    INNER JOIN users u ON u.id_user = at.id_user
    WHERE at.token_hash = ?
      AND at.tipe_token = ?
      AND at.used_at IS NULL
      AND at.expires_at > NOW()
    ORDER BY at.id_token DESC
    LIMIT 1
    `,
    [token_hash, tipe_token]
  )
  return rows[0] || null
}

const findValidResetOtp = async ({ email, otp_hash }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase()
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
    INNER JOIN users u ON u.id_user = at.id_user
    WHERE u.email = ?
      AND at.token_hash = ?
      AND at.tipe_token = 'reset_password'
      AND at.used_at IS NULL
      AND at.expires_at > NOW()
    ORDER BY at.id_token DESC
    LIMIT 1
    `,
    [normalizedEmail, otp_hash]
  )
  return rows[0] || null
}

const updateVerificationEmailSentAt = async (id_user) => {
  const [result] = await pool.query(
    `UPDATE users SET verification_email_sent_at = NOW(), updated_at = NOW() WHERE id_user = ?`,
    [id_user]
  )
  return result.affectedRows > 0
}

const verifyEmailWithToken = async ({ id_user, id_token }) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [tokenRows] = await connection.query(
      `SELECT id_token, id_user, tipe_token, used_at, expires_at
       FROM auth_tokens
       WHERE id_token = ? AND id_user = ? AND tipe_token = 'verifikasi_email' AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1 FOR UPDATE`,
      [id_token, id_user]
    )
    if (!tokenRows[0]) {
      throw new Error("Token aktivasi tidak valid, sudah digunakan, atau sudah kedaluwarsa")
    }
    await connection.query(
      `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), status_akun = 'aktif', updated_at = NOW() WHERE id_user = ?`,
      [id_user]
    )
    await connection.query(
      `UPDATE auth_tokens SET used_at = NOW() WHERE id_user = ? AND tipe_token = 'verifikasi_email' AND used_at IS NULL`,
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

const resetPasswordWithToken = async ({ id_user, id_token, hashed_password }) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [tokenRows] = await connection.query(
      `SELECT id_token, id_user, tipe_token, used_at, expires_at
       FROM auth_tokens
       WHERE id_token = ? AND id_user = ? AND tipe_token = 'reset_password' AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1 FOR UPDATE`,
      [id_token, id_user]
    )
    if (!tokenRows[0]) {
      throw new Error("Kode OTP tidak valid, sudah digunakan, atau sudah kedaluwarsa")
    }
    await connection.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id_user = ?`,
      [hashed_password, id_user]
    )
    await connection.query(
      `UPDATE auth_tokens SET used_at = NOW() WHERE id_user = ? AND tipe_token = 'reset_password' AND used_at IS NULL`,
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

const updateLastLogin = async (id_user) => {
  const [result] = await pool.query(
    `UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id_user = ?`,
    [id_user]
  )
  return result.affectedRows > 0
}

const countOwner = async () => {
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'owner'`)
  return Number(rows[0]?.total || 0)
}

const deleteExpiredAuthTokens = async () => {
  const [result] = await pool.query(
    `DELETE FROM auth_tokens WHERE expires_at < NOW() OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))`
  )
  return result.affectedRows
}

const getBusinessCategories = async () => {
  const [rows] = await pool.query(
    `SELECT bc.id_business_category, bc.nama_kategori FROM business_categories bc WHERE bc.status = 'aktif' ORDER BY bc.nama_kategori ASC`
  )
  return rows
}

const findBusinessCategoryById = async (id_business_category) => {
  const [rows] = await pool.query(
    `SELECT bc.id_business_category, bc.nama_kategori, bc.status, bc.created_at, bc.updated_at
     FROM business_categories bc
     WHERE bc.id_business_category = ? AND bc.status = 'aktif'
     LIMIT 1`,
    [id_business_category]
  )
  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FUNGSI UNTUK SUBSCRIPTION FREE (OTOMATIS)
|--------------------------------------------------------------------------
*/

/**
 * Cari paket Free yang aktif
 */
const findFreePlan = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM subscription_plans WHERE LOWER(nama_paket) = 'free' AND status_paket = 'aktif' LIMIT 1`
  )
  return rows[0] || null
}

/**
 * Pastikan paket Free ada di database (jika belum, buat)
 */
const ensureFreePlan = async () => {
  let plan = await findFreePlan()

  if (!plan) {
    const [result] = await pool.query(
      `INSERT INTO subscription_plans
       (nama_paket, deskripsi, durasi_hari, harga, batas_toko, batas_user, batas_produk, status_paket)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Free',
        'Paket gratis selama 14 hari',
        14,
        0,
        1,
        3,
        100,
        'aktif'
      ]
    )

    const [rows] = await pool.query(
      `SELECT * FROM subscription_plans WHERE id_plan = ?`,
      [result.insertId]
    )

    plan = rows[0]
  }

  return plan
}

/**
 * Cek apakah owner sudah memiliki subscription aktif
 */
const findActiveSubscriptionByOwner = async (ownerId) => {
  const [rows] = await pool.query(
    `SELECT * FROM subscriptions WHERE id_owner = ? AND status_langganan = 'aktif' LIMIT 1`,
    [ownerId]
  )
  return rows[0] || null
}

/**
 * Buat subscription baru
 */
const createSubscription = async (data) => {
  const {
    id_owner,
    id_plan,
    jumlah_bulan,
    tanggal_mulai,
    tanggal_berakhir,
    harga,
    status_langganan,
    metode_pembayaran,
    kode_invoice,
    bukti_pembayaran,
    catatan
  } = data

  const [result] = await pool.query(
    `INSERT INTO subscriptions
     (id_owner, id_plan, jumlah_bulan, tanggal_mulai, tanggal_berakhir,
      harga, status_langganan, metode_pembayaran, kode_invoice,
      bukti_pembayaran, catatan)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_owner,
      id_plan,
      jumlah_bulan || 0,
      tanggal_mulai || null,
      tanggal_berakhir || null,
      harga || 0,
      status_langganan || 'aktif',
      metode_pembayaran || 'manual_transfer',
      kode_invoice,
      bukti_pembayaran || null,
      catatan || null
    ]
  )
  const [rows] = await pool.query(`SELECT * FROM subscriptions WHERE id_subscription = ?`, [result.insertId])
  return rows[0]
}

/**
 * Generate kode invoice unik untuk subscription
 */
const generateInvoiceCode = (prefix = 'INV-FREE') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
}

/*
|--------------------------------------------------------------------------
| CEK LANGGANAN OWNER AKTIF
|--------------------------------------------------------------------------
*/
const findActiveSubscriptionByStore = async (idStore) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.status_langganan,
      s.tanggal_berakhir
    FROM stores st
    INNER JOIN subscriptions s
      ON s.id_owner = st.id_owner
    WHERE st.id_store = ?
      AND s.status_langganan = 'aktif'
      AND (
            s.tanggal_berakhir IS NULL
            OR s.tanggal_berakhir >= NOW()
          )
    ORDER BY s.tanggal_berakhir DESC
    LIMIT 1
    `,
    [idStore]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| EXPORT SEMUA FUNGSI
|--------------------------------------------------------------------------
*/
module.exports = {
  // User
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserByEmail,
  findUserById,

  // Business Category
  getBusinessCategories,
  findBusinessCategoryById,

  // Register
  registerOwner,

  // Auth Token
  createAuthToken,
  findValidAuthToken,
  findValidResetOtp,

  // Email Verification
  updateVerificationEmailSentAt,
  verifyEmailWithToken,

  // Reset Password
  resetPasswordWithToken,

  // Login
  updateLastLogin,

  // Statistik & Cleanup
  countOwner,
  deleteExpiredAuthTokens,

  // Subscription Free
  findFreePlan,
  ensureFreePlan,
  findActiveSubscriptionByOwner,
  createSubscription,
  findActiveSubscriptionByStore,
  generateInvoiceCode
}