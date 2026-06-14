const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| CREATE MODEL ERROR
|--------------------------------------------------------------------------
*/
const createModelError = (
  message,
  statusCode = 400,
  code = "USER_MODEL_ERROR",
  details = null
) => {
  const error = new Error(message)

  error.statusCode = statusCode
  error.code = code

  if (details) {
    error.details = details
  }

  return error
}

/*
|--------------------------------------------------------------------------
| FIND ALL USERS
|--------------------------------------------------------------------------
| Mengambil semua data user kecuali password.
|--------------------------------------------------------------------------
*/
const findAll = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s
      ON s.id_store = u.id_store
    ORDER BY u.id_user DESC
    `
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL USERS BY OWNER
|--------------------------------------------------------------------------
| Owner melihat akun sendiri dan semua admin/kasir pada toko miliknya.
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s
      ON s.id_store = u.id_store
    WHERE
      u.id_user = ?
      OR s.id_owner = ?
    ORDER BY u.id_user DESC
    `,
    [id_owner, id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL USERS BY STORE
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s
      ON s.id_store = u.id_store
    WHERE u.id_store = ?
    ORDER BY u.id_user DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND USER BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_user) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      s.id_owner,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
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
| FIND USER BY ID AND OWNER
|--------------------------------------------------------------------------
| Memastikan user berada pada toko milik owner.
|--------------------------------------------------------------------------
*/
const findByIdAndOwner = async (
  id_user,
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      s.id_owner,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s
      ON s.id_store = u.id_store
    WHERE u.id_user = ?
      AND (
        u.id_user = ?
        OR s.id_owner = ?
      )
    LIMIT 1
    `,
    [
      id_user,
      id_owner,
      id_owner
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME
|--------------------------------------------------------------------------
*/
const findByUsername = async (username) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_user,
      id_store,
      username
    FROM users
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))
    LIMIT 1
    `,
    [username]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY EMAIL
|--------------------------------------------------------------------------
*/
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_user,
      id_store,
      email
    FROM users
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
    LIMIT 1
    `,
    [email]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
*/
const findStoreByIdAndOwner = async (
  id_store,
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko,
      status_toko
    FROM stores
    WHERE id_store = ?
      AND id_owner = ?
    LIMIT 1
    `,
    [
      id_store,
      id_owner
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND ACTIVE SUBSCRIPTION BY OWNER
|--------------------------------------------------------------------------
*/
const findActiveSubscriptionByOwner = async (
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_owner,
      sub.id_plan,
      sub.kode_invoice,
      sub.tanggal_mulai,
      sub.tanggal_berakhir,
      sub.status_langganan,

      plan.nama_paket,
      plan.batas_toko,
      plan.batas_user,
      plan.batas_produk,
      plan.status_paket

    FROM subscriptions sub

    INNER JOIN subscription_plans plan
      ON plan.id_plan = sub.id_plan

    WHERE sub.id_owner = ?
      AND sub.status_langganan = 'aktif'
      AND plan.status_paket = 'aktif'
      AND sub.tanggal_mulai IS NOT NULL
      AND sub.tanggal_berakhir IS NOT NULL
      AND sub.tanggal_mulai <= NOW()
      AND sub.tanggal_berakhir >= NOW()

    ORDER BY
      sub.tanggal_berakhir DESC,
      sub.id_subscription DESC

    LIMIT 1
    `,
    [id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| COUNT USERS BY OWNER
|--------------------------------------------------------------------------
| Menghitung admin dan kasir pada seluruh toko milik owner.
| Akun owner tidak dihitung.
|--------------------------------------------------------------------------
*/
const countByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM users u

    INNER JOIN stores s
      ON s.id_store = u.id_store

    WHERE s.id_owner = ?
      AND u.role IN ('admin', 'kasir')
    `,
    [id_owner]
  )

  return Number(rows[0]?.total || 0)
}

/*
|--------------------------------------------------------------------------
| GET USER USAGE BY OWNER
|--------------------------------------------------------------------------
*/
const getUserUsageByOwner = async (
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_plan,
      plan.nama_paket,
      plan.batas_user,
      sub.tanggal_mulai,
      sub.tanggal_berakhir,

      (
        SELECT COUNT(*)
        FROM users staff

        INNER JOIN stores owner_store
          ON owner_store.id_store = staff.id_store

        WHERE owner_store.id_owner = sub.id_owner
          AND staff.role IN ('admin', 'kasir')
      ) AS total_user

    FROM subscriptions sub

    INNER JOIN subscription_plans plan
      ON plan.id_plan = sub.id_plan

    WHERE sub.id_owner = ?
      AND sub.status_langganan = 'aktif'
      AND plan.status_paket = 'aktif'
      AND sub.tanggal_mulai IS NOT NULL
      AND sub.tanggal_berakhir IS NOT NULL
      AND sub.tanggal_mulai <= NOW()
      AND sub.tanggal_berakhir >= NOW()

    ORDER BY
      sub.tanggal_berakhir DESC,
      sub.id_subscription DESC

    LIMIT 1
    `,
    [id_owner]
  )

  if (!rows[0]) {
    return null
  }

  const usage = rows[0]

  const batasUser = Number(
    usage.batas_user || 0
  )

  const totalUser = Number(
    usage.total_user || 0
  )

  return {
    id_subscription: usage.id_subscription,
    id_plan: usage.id_plan,
    nama_paket: usage.nama_paket,
    batas_user: batasUser,
    total_user: totalUser,
    sisa_user: Math.max(
      batasUser - totalUser,
      0
    ),
    tanggal_mulai: usage.tanggal_mulai,
    tanggal_berakhir: usage.tanggal_berakhir
  }
}

/*
|--------------------------------------------------------------------------
| CREATE USER WITH SUBSCRIPTION LIMIT
|--------------------------------------------------------------------------
| Proses dilakukan dalam satu transaction:
|
| 1. Mengunci owner.
| 2. Memeriksa langganan aktif.
| 3. Memeriksa batas user.
| 4. Memeriksa toko.
| 5. Memeriksa username dan email.
| 6. Membuat admin/kasir.
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    /*
    |--------------------------------------------------------------------------
    | LOCK OWNER
    |--------------------------------------------------------------------------
    | Membuat proses pembuatan user untuk owner yang sama berjalan bergantian.
    |--------------------------------------------------------------------------
    */
    const [ownerRows] = await connection.query(
      `
      SELECT
        id_user,
        nama_lengkap,
        role,
        status_akun
      FROM users
      WHERE id_user = ?
      LIMIT 1
      FOR UPDATE
      `,
      [data.id_owner]
    )

    const owner = ownerRows[0]

    if (!owner) {
      throw createModelError(
        "Owner tidak ditemukan",
        404,
        "OWNER_NOT_FOUND"
      )
    }

    if (owner.role !== "owner") {
      throw createModelError(
        "User tersebut bukan owner",
        403,
        "USER_NOT_OWNER"
      )
    }

    if (owner.status_akun !== "aktif") {
      throw createModelError(
        "Akun owner sedang tidak aktif",
        403,
        "OWNER_INACTIVE"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK ACTIVE SUBSCRIPTION
    |--------------------------------------------------------------------------
    */
    const [subscriptionRows] =
      await connection.query(
        `
        SELECT
          sub.id_subscription,
          sub.id_owner,
          sub.id_plan,
          sub.kode_invoice,
          sub.tanggal_mulai,
          sub.tanggal_berakhir,

          plan.nama_paket,
          plan.batas_user,
          plan.status_paket

        FROM subscriptions sub

        INNER JOIN subscription_plans plan
          ON plan.id_plan = sub.id_plan

        WHERE sub.id_owner = ?
          AND sub.status_langganan = 'aktif'
          AND plan.status_paket = 'aktif'
          AND sub.tanggal_mulai IS NOT NULL
          AND sub.tanggal_berakhir IS NOT NULL
          AND sub.tanggal_mulai <= NOW()
          AND sub.tanggal_berakhir >= NOW()

        ORDER BY
          sub.tanggal_berakhir DESC,
          sub.id_subscription DESC

        LIMIT 1
        FOR UPDATE
        `,
        [data.id_owner]
      )

    const subscription = subscriptionRows[0]

    if (!subscription) {
      throw createModelError(
        "Anda tidak memiliki langganan aktif. Silakan aktifkan paket terlebih dahulu",
        403,
        "ACTIVE_SUBSCRIPTION_NOT_FOUND"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | COUNT CURRENT STAFF
    |--------------------------------------------------------------------------
    */
    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM users u

      INNER JOIN stores s
        ON s.id_store = u.id_store

      WHERE s.id_owner = ?
        AND u.role IN ('admin', 'kasir')
      `,
      [data.id_owner]
    )

    const totalUser = Number(
      countRows[0]?.total || 0
    )

    const userLimit = Number(
      subscription.batas_user || 0
    )

    if (userLimit <= 0) {
      throw createModelError(
        "Paket langganan tidak mengizinkan penambahan user",
        403,
        "USER_NOT_ALLOWED",
        {
          nama_paket: subscription.nama_paket,
          total_user: totalUser,
          batas_user: userLimit,
          sisa_user: 0
        }
      )
    }

    if (totalUser >= userLimit) {
      throw createModelError(
        `Batas user pada paket ${subscription.nama_paket} telah tercapai. Maksimal ${userLimit} user`,
        403,
        "USER_LIMIT_REACHED",
        {
          nama_paket: subscription.nama_paket,
          total_user: totalUser,
          batas_user: userLimit,
          sisa_user: 0,
          tanggal_berakhir:
            subscription.tanggal_berakhir
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK STORE OWNERSHIP
    |--------------------------------------------------------------------------
    */
    const [storeRows] = await connection.query(
      `
      SELECT
        id_store,
        id_owner,
        nama_toko,
        status_toko
      FROM stores
      WHERE id_store = ?
        AND id_owner = ?
      LIMIT 1
      `,
      [
        data.id_store,
        data.id_owner
      ]
    )

    const store = storeRows[0]

    if (!store) {
      throw createModelError(
        "Toko tidak ditemukan atau bukan milik owner ini",
        404,
        "STORE_NOT_FOUND"
      )
    }

    if (store.status_toko !== "aktif") {
      throw createModelError(
        "Toko sedang nonaktif",
        403,
        "STORE_INACTIVE"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK USERNAME
    |--------------------------------------------------------------------------
    */
    const [usernameRows] =
      await connection.query(
        `
        SELECT id_user
        FROM users
        WHERE LOWER(TRIM(username)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [data.username]
      )

    if (usernameRows.length > 0) {
      throw createModelError(
        "Username sudah digunakan",
        409,
        "USERNAME_ALREADY_EXISTS"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EMAIL
    |--------------------------------------------------------------------------
    */
    const [emailRows] =
      await connection.query(
        `
        SELECT id_user
        FROM users
        WHERE LOWER(TRIM(email)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [data.email]
      )

    if (emailRows.length > 0) {
      throw createModelError(
        "Email sudah digunakan",
        409,
        "EMAIL_ALREADY_EXISTS"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | INSERT USER
    |--------------------------------------------------------------------------
    */
    const [result] = await connection.query(
      `
      INSERT INTO users
      (
        id_store,
        nama_lengkap,
        username,
        email,
        no_hp,
        password,
        role,
        status_akun
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.id_store,
        data.nama_lengkap,
        data.username,
        data.email,
        data.no_hp || null,
        data.password,
        data.role,
        data.status_akun || "aktif"
      ]
    )

    await connection.commit()

    return {
      id_user: result.insertId,
      id_store: data.id_store,
      nama_toko: store.nama_toko,
      nama_lengkap: data.nama_lengkap,
      username: data.username,
      email: data.email,
      no_hp: data.no_hp || null,
      role: data.role,
      status_akun:
        data.status_akun || "aktif",

      penggunaan_paket: {
        id_subscription:
          subscription.id_subscription,
        id_plan: subscription.id_plan,
        nama_paket: subscription.nama_paket,
        batas_user: userLimit,
        total_user_sebelum: totalUser,
        total_user_sekarang: totalUser + 1,
        sisa_user: Math.max(
          userLimit - (totalUser + 1),
          0
        ),
        tanggal_mulai:
          subscription.tanggal_mulai,
        tanggal_berakhir:
          subscription.tanggal_berakhir
      }
    }
  } catch (error) {
    await connection.rollback()

    if (error.code === "ER_DUP_ENTRY") {
      const message =
        String(error.message || "").toLowerCase()

      if (message.includes("username")) {
        throw createModelError(
          "Username sudah digunakan",
          409,
          "USERNAME_ALREADY_EXISTS"
        )
      }

      if (message.includes("email")) {
        throw createModelError(
          "Email sudah digunakan",
          409,
          "EMAIL_ALREADY_EXISTS"
        )
      }

      throw createModelError(
        "Data user sudah digunakan",
        409,
        "USER_DATA_ALREADY_EXISTS"
      )
    }

    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
const update = async (id_user, data) => {
  try {
    const [result] = await pool.query(
      `
      UPDATE users
      SET
        id_store = ?,
        nama_lengkap = ?,
        username = ?,
        email = ?,
        no_hp = ?,
        role = ?,
        status_akun = ?
      WHERE id_user = ?
      `,
      [
        data.id_store,
        data.nama_lengkap,
        data.username,
        data.email,
        data.no_hp || null,
        data.role,
        data.status_akun,
        id_user
      ]
    )

    return result.affectedRows > 0
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const message =
        String(error.message || "").toLowerCase()

      if (message.includes("username")) {
        throw createModelError(
          "Username sudah digunakan",
          409,
          "USERNAME_ALREADY_EXISTS"
        )
      }

      if (message.includes("email")) {
        throw createModelError(
          "Email sudah digunakan",
          409,
          "EMAIL_ALREADY_EXISTS"
        )
      }
    }

    throw error
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PASSWORD
|--------------------------------------------------------------------------
*/
const updatePassword = async (
  id_user,
  password
) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET password = ?
    WHERE id_user = ?
    `,
    [
      password,
      id_user
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/
const remove = async (id_user) => {
  const [result] = await pool.query(
    `
    DELETE FROM users
    WHERE id_user = ?
    `,
    [id_user]
  )

  return result.affectedRows > 0
}

module.exports = {
  findAll,
  findAllByOwner,
  findAllByStore,
  findById,
  findByIdAndOwner,
  findByUsername,
  findByEmail,
  findStoreByIdAndOwner,
  findActiveSubscriptionByOwner,
  countByOwner,
  getUserUsageByOwner,
  create,
  update,
  updatePassword,
  remove
}