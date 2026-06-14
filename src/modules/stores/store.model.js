const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| CREATE MODEL ERROR
|--------------------------------------------------------------------------
*/
const createModelError = (
  message,
  statusCode = 400,
  code = "STORE_ERROR",
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
| FIND ALL STORES
|--------------------------------------------------------------------------
| Mengambil semua data toko.
|--------------------------------------------------------------------------
*/
const findAll = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_store,
      s.id_owner,
      u.nama_lengkap AS nama_owner,
      s.nama_toko,
      s.alamat,
      s.no_hp,
      s.email,
      s.logo,
      s.status_toko,
      s.ppn_aktif,
      s.ppn_persen,
      s.created_at,
      s.updated_at
    FROM stores s
    LEFT JOIN users u
      ON u.id_user = s.id_owner
    ORDER BY s.id_store DESC
    `
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_store,
      s.id_owner,
      u.nama_lengkap AS nama_owner,
      s.nama_toko,
      s.alamat,
      s.no_hp,
      s.email,
      s.logo,
      s.status_toko,
      s.ppn_aktif,
      s.ppn_persen,
      s.created_at,
      s.updated_at
    FROM stores s
    LEFT JOIN users u
      ON u.id_user = s.id_owner
    WHERE s.id_store = ?
    LIMIT 1
    `,
    [id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORES BY OWNER
|--------------------------------------------------------------------------
*/
const findByOwnerId = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_store,
      s.id_owner,
      s.nama_toko,
      s.alamat,
      s.no_hp,
      s.email,
      s.logo,
      s.status_toko,
      s.ppn_aktif,
      s.ppn_persen,
      s.created_at,
      s.updated_at
    FROM stores s
    WHERE s.id_owner = ?
    ORDER BY s.id_store DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY NAME AND OWNER
|--------------------------------------------------------------------------
*/
const findByNameAndOwner = async (nama_toko, id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko
    FROM stores
    WHERE id_owner = ?
      AND LOWER(TRIM(nama_toko)) = LOWER(TRIM(?))
    LIMIT 1
    `,
    [id_owner, nama_toko]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND ACTIVE SUBSCRIPTION
|--------------------------------------------------------------------------
| Mengambil langganan aktif terbaru milik owner.
|--------------------------------------------------------------------------
*/
const findActiveSubscriptionByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_owner,
      sub.id_plan,
      sub.kode_invoice,
      sub.tanggal_mulai,
      sub.tanggal_berakhir,
      sub.harga,
      sub.status_langganan,

      plan.nama_paket,
      plan.deskripsi,
      plan.durasi_hari,
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
| CREATE STORE WITH SUBSCRIPTION LIMIT
|--------------------------------------------------------------------------
| Proses berikut dijalankan dalam satu transaction:
|
| 1. Mengunci data owner.
| 2. Memeriksa akun owner.
| 3. Memeriksa langganan aktif.
| 4. Memeriksa batas toko paket.
| 5. Memeriksa nama toko.
| 6. Membuat toko.
| 7. Menghubungkan owner ke toko pertama.
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
    | Baris owner dikunci agar request pembuatan toko untuk owner yang sama
    | tidak berjalan bersamaan.
    |--------------------------------------------------------------------------
    */
    const [ownerRows] = await connection.query(
      `
      SELECT
        id_user,
        id_store,
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
    | GET ACTIVE SUBSCRIPTION
    |--------------------------------------------------------------------------
    */
    const [subscriptionRows] = await connection.query(
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
    | COUNT OWNER STORES
    |--------------------------------------------------------------------------
    */
    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM stores
      WHERE id_owner = ?
      `,
      [data.id_owner]
    )

    const totalStore = Number(countRows[0]?.total || 0)
    const storeLimit = Number(subscription.batas_toko || 0)

    if (storeLimit <= 0) {
      throw createModelError(
        "Paket langganan tidak mengizinkan pembuatan toko",
        403,
        "STORE_NOT_ALLOWED",
        {
          nama_paket: subscription.nama_paket,
          total_toko: totalStore,
          batas_toko: storeLimit
        }
      )
    }

    if (totalStore >= storeLimit) {
      throw createModelError(
        `Batas toko pada paket ${subscription.nama_paket} telah tercapai. Maksimal ${storeLimit} toko`,
        403,
        "STORE_LIMIT_REACHED",
        {
          nama_paket: subscription.nama_paket,
          total_toko: totalStore,
          batas_toko: storeLimit,
          sisa_toko: 0,
          tanggal_berakhir: subscription.tanggal_berakhir
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK DUPLICATE STORE NAME
    |--------------------------------------------------------------------------
    */
    const [existingStoreRows] = await connection.query(
      `
      SELECT
        id_store,
        id_owner,
        nama_toko
      FROM stores
      WHERE id_owner = ?
        AND LOWER(TRIM(nama_toko)) = LOWER(TRIM(?))
      LIMIT 1
      `,
      [data.id_owner, data.nama_toko]
    )

    if (existingStoreRows.length > 0) {
      throw createModelError(
        "Nama toko sudah digunakan",
        409,
        "STORE_NAME_ALREADY_EXISTS"
      )
    }

    const finalNamaToko = data.nama_toko.trim()
    const finalAlamat = data.alamat?.trim() || null
    const finalNoHp = data.no_hp?.trim() || null
    const finalEmail = data.email?.trim() || null
    const finalLogo = data.logo || null

    const finalStatusToko = data.status_toko || "aktif"

    const finalPpnAktif =
      data.ppn_aktif === "ya"
        ? "ya"
        : "tidak"

    const finalPpnPersen =
      finalPpnAktif === "ya"
        ? Number(data.ppn_persen || 0)
        : 0

    /*
    |--------------------------------------------------------------------------
    | INSERT STORE
    |--------------------------------------------------------------------------
    */
    const [result] = await connection.query(
      `
      INSERT INTO stores
      (
        id_owner,
        nama_toko,
        alamat,
        no_hp,
        email,
        logo,
        status_toko,
        ppn_aktif,
        ppn_persen
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.id_owner,
        finalNamaToko,
        finalAlamat,
        finalNoHp,
        finalEmail,
        finalLogo,
        finalStatusToko,
        finalPpnAktif,
        finalPpnPersen
      ]
    )

    const idStore = result.insertId

    /*
    |--------------------------------------------------------------------------
    | ASSIGN FIRST STORE TO OWNER
    |--------------------------------------------------------------------------
    | Owner hanya langsung diarahkan ke toko pertama apabila id_store miliknya
    | masih kosong.
    |--------------------------------------------------------------------------
    */
    if (!owner.id_store) {
      await connection.query(
        `
        UPDATE users
        SET id_store = ?
        WHERE id_user = ?
          AND id_store IS NULL
        `,
        [idStore, data.id_owner]
      )
    }

    await connection.commit()

    return {
      id_store: idStore,
      id_owner: data.id_owner,
      nama_owner: owner.nama_lengkap,
      nama_toko: finalNamaToko,
      alamat: finalAlamat,
      no_hp: finalNoHp,
      email: finalEmail,
      logo: finalLogo,
      status_toko: finalStatusToko,
      ppn_aktif: finalPpnAktif,
      ppn_persen: finalPpnPersen,

      penggunaan_paket: {
        id_subscription: subscription.id_subscription,
        id_plan: subscription.id_plan,
        nama_paket: subscription.nama_paket,
        batas_toko: storeLimit,
        total_toko_sebelum: totalStore,
        total_toko_sekarang: totalStore + 1,
        sisa_toko: Math.max(
          storeLimit - (totalStore + 1),
          0
        ),
        tanggal_mulai: subscription.tanggal_mulai,
        tanggal_berakhir: subscription.tanggal_berakhir
      }
    }
  } catch (error) {
    await connection.rollback()

    /*
    |--------------------------------------------------------------------------
    | HANDLE DATABASE DUPLICATE
    |--------------------------------------------------------------------------
    */
    if (error.code === "ER_DUP_ENTRY") {
      throw createModelError(
        "Nama toko sudah digunakan",
        409,
        "STORE_NAME_ALREADY_EXISTS"
      )
    }

    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE
|--------------------------------------------------------------------------
*/
const update = async (id_store, data) => {
  const [result] = await pool.query(
    `
    UPDATE stores
    SET
      nama_toko = ?,
      alamat = ?,
      no_hp = ?,
      email = ?,
      logo = ?,
      status_toko = ?,
      ppn_aktif = ?,
      ppn_persen = ?
    WHERE id_store = ?
    `,
    [
      data.nama_toko,
      data.alamat || null,
      data.no_hp || null,
      data.email || null,
      data.logo || null,
      data.status_toko,
      data.ppn_aktif || "tidak",
      data.ppn_aktif === "ya"
        ? Number(data.ppn_persen || 0)
        : 0,
      id_store
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO
|--------------------------------------------------------------------------
*/
const updateLogo = async (id_store, logo) => {
  const [result] = await pool.query(
    `
    UPDATE stores
    SET logo = ?
    WHERE id_store = ?
    `,
    [logo, id_store]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE STORE
|--------------------------------------------------------------------------
*/
const remove = async (id_store) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [storeRows] = await connection.query(
      `
      SELECT
        id_store,
        id_owner
      FROM stores
      WHERE id_store = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_store]
    )

    const store = storeRows[0]

    if (!store) {
      await connection.rollback()
      return false
    }

    /*
    |--------------------------------------------------------------------------
    | LEPASKAN USER DARI TOKO
    |--------------------------------------------------------------------------
    | Penting karena users.id_store pada skema Anda belum memiliki foreign key.
    |--------------------------------------------------------------------------
    */
    await connection.query(
      `
      UPDATE users
      SET id_store = NULL
      WHERE id_store = ?
      `,
      [id_store]
    )

    const [result] = await connection.query(
      `
      DELETE FROM stores
      WHERE id_store = ?
      `,
      [id_store]
    )

    /*
    |--------------------------------------------------------------------------
    | SET TOKO LAIN SEBAGAI TOKO AKTIF OWNER
    |--------------------------------------------------------------------------
    */
    const [remainingStoreRows] = await connection.query(
      `
      SELECT id_store
      FROM stores
      WHERE id_owner = ?
      ORDER BY id_store ASC
      LIMIT 1
      `,
      [store.id_owner]
    )

    if (remainingStoreRows.length > 0) {
      await connection.query(
        `
        UPDATE users
        SET id_store = ?
        WHERE id_user = ?
          AND role = 'owner'
        `,
        [
          remainingStoreRows[0].id_store,
          store.id_owner
        ]
      )
    }

    await connection.commit()

    return result.affectedRows > 0
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| ASSIGN STORE TO USER
|--------------------------------------------------------------------------
*/
const assignStoreToUser = async (id_user, id_store) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET id_store = ?
    WHERE id_user = ?
    `,
    [id_store, id_user]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| COUNT STORE BY OWNER
|--------------------------------------------------------------------------
*/
const countByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM stores
    WHERE id_owner = ?
    `,
    [id_owner]
  )

  return Number(rows[0]?.total || 0)
}

/*
|--------------------------------------------------------------------------
| GET STORE USAGE BY OWNER
|--------------------------------------------------------------------------
| Digunakan untuk menampilkan jumlah toko, batas toko dan sisa toko.
|--------------------------------------------------------------------------
*/
const getStoreUsageByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_plan,
      plan.nama_paket,
      plan.batas_toko,
      sub.tanggal_mulai,
      sub.tanggal_berakhir,

      (
        SELECT COUNT(*)
        FROM stores store_count
        WHERE store_count.id_owner = sub.id_owner
      ) AS total_toko

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

  return {
    id_subscription: usage.id_subscription,
    id_plan: usage.id_plan,
    nama_paket: usage.nama_paket,
    batas_toko: Number(usage.batas_toko || 0),
    total_toko: Number(usage.total_toko || 0),
    sisa_toko: Math.max(
      Number(usage.batas_toko || 0) -
      Number(usage.total_toko || 0),
      0
    ),
    tanggal_mulai: usage.tanggal_mulai,
    tanggal_berakhir: usage.tanggal_berakhir
  }
}

module.exports = {
  findAll,
  findById,
  findByOwnerId,
  findByNameAndOwner,
  findActiveSubscriptionByOwner,
  create,
  update,
  updateLogo,
  remove,
  assignStoreToUser,
  countByOwner,
  getStoreUsageByOwner
}